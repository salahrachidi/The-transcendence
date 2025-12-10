#!/bin/bash
set -e

VAULT_ADDR="https://vault:8200"
KEYS_FILE="./vault-keys.json"
ENV_FILE=".env"
SECRETS_PATH="secret/descendence/env"
SECRETS_FILE="./secrets/role_creds.txt"

export VAULT_ADDR
export VAULT_SKIP_VERIFY=true
# source ./secrets/role_creds.txt

echo "Waiting for Vault..."
until vault status >/dev/null 2>&1 || [ $? -eq 2 ]; do
    sleep 1
done

if [  -f "$KEYS_FILE" ]; then

    echo "Unsealing Vault..."
    jq -r '.unseal_keys_hex[] // .keys[]' "$KEYS_FILE" | head -n 3 | while read key; do
        vault operator unseal "$key" >/dev/null
    done
    echo "shamir secrets already been there haha, now vault is unsealed!"
    exit 0;
fi

if ! vault status >/dev/null 2>&1; then
    echo "Initializing Vault..."
    vault operator init -key-shares=5 -key-threshold=3 -format=json > "$KEYS_FILE"
    chmod 600 "$KEYS_FILE"
fi

if [ -f "$KEYS_FILE" ]; then

    echo "Unsealing Vault..."
    jq -r '.unseal_keys_hex[] // .keys[]' "$KEYS_FILE" | head -n 3 | while read key; do
        vault operator unseal "$key" >/dev/null
    done
fi

if [ -f "$KEYS_FILE" ]; then
    ROOT_TOKEN=$(jq -r '.root_token' "$KEYS_FILE")
    vault login -no-print "$ROOT_TOKEN"
fi

vault secrets enable -path=secret kv-v2 2>/dev/null || true

vault policy write descendence-policy - <<INNEREOF
path "secret/data/descendence/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/descendence/*" {
  capabilities = ["list"]
}
INNEREOF


vault auth enable approle 2>/dev/null || true
vault write auth/approle/role/descendence-app \
    token_policies="descendence-policy" \
    token_ttl=1h \
    token_max_ttl=1337h \
    secret_id_ttl=1337h


ROLE_ID=$(vault read -field=role_id auth/approle/role/descendence-app/role-id)
SECRET_ID=$(vault write -f -field=secret_id auth/approle/role/descendence-app/secret-id)

if [ ! -f "$ENV_FILE" ]; then
    echo ".env file not found at $ENV_FILE - skipping secret upload"
else
    SECRET_JSON=$(grep -vE '^\s*$|^\s*#' "$ENV_FILE" \
        | while IFS='=' read -r key value; do
            key=$(echo "$key" | xargs)
            value=$(echo "$value" | xargs | sed "s/^['\"]//; s/['\"]$//")
            [ -n "$key" ] && printf '"%s":%s\n' "$key" "$(printf %s "$value" | jq -Rs .)"
        done | paste -sd "," -)
    
    SECRET_JSON="{$SECRET_JSON}"
    
    echo "$SECRET_JSON" | vault kv put "$SECRETS_PATH" -
        
    vault kv get -format=json "$SECRETS_PATH" \
      | jq -r '.data.data | keys[]' \
      | sed 's/^/  ✓ /'
fi


echo "putting the role id and secret id for the team inside the .env file!"
sleep 1
echo "export ROLE_ID=$ROLE_ID" > $SECRETS_FILE ; echo "export SECRET_ID=$SECRET_ID" >> $SECRETS_FILE
# export ROLE_ID SECRET_ID
