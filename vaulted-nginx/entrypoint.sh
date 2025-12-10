#!/bin/sh
set -e

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_ROLE_ID="${VAULT_ROLE_ID}"
VAULT_SECRET_ID="${VAULT_SECRET_ID}"
SECRET_PATH="${VAULT_SECRET_PATH:-secret/descendence/env}"
export VAULT_SKIP_VERIFY=true

if [ -z "$VAULT_ROLE_ID" ] || [ -z "$VAULT_SECRET_ID" ]; then
    echo "ERROR: VAULT_ROLE_ID and VAULT_SECRET_ID must be set"
    exit 1
fi

echo "Authenticating with Vault..."
VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$VAULT_ROLE_ID" secret_id="$VAULT_SECRET_ID")
export VAULT_TOKEN

echo "Fetching secrets from Vault..."
SECRETS=$(vault kv get -format=json "$SECRET_PATH" | jq -r '.data.data')
export SECRETS

echo "$SECRETS"

echo "Fetching certificates from Vault..."
if echo "$SECRETS" | jq -e '.NGINX_CERT' > /dev/null 2>&1; then
    export NGINX_CERT=$(echo "$SECRETS" | jq -r '.NGINX_CERT')
    echo "NGINX_CERT fetched from Vault"
fi

if echo "$SECRETS" | jq -e '.NGINX_KEY' > /dev/null 2>&1; then
    export NGINX_KEY=$(echo "$SECRETS" | jq -r '.NGINX_KEY')
    echo "NGINX_KEY fetched from Vault"
fi

mkdir -p /etc/nginx/certs

if [ -n "$NGINX_CERT" ] && [ -n "$NGINX_KEY" ]; then
    echo "Decoding certificates..."
    echo "$NGINX_CERT" | base64 -d > /etc/nginx/certs/nginx.crt
    echo "$NGINX_KEY" | base64 -d > /etc/nginx/certs/nginx.key
    chmod 644 /etc/nginx/certs/nginx.crt
    chmod 600 /etc/nginx/certs/nginx.key
    echo "Certificates decoded successfully"
else
    echo "ERROR: NGINX_CERT and NGINX_KEY must be present in Vault"
    exit 1
fi

echo "Vault secrets loaded successfully"
