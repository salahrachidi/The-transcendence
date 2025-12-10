#!/bin/sh
set -e

VAULT_ADDR="${VAULT_ADDR:-https://vault:8200}"
VAULT_ROLE_ID="${VAULT_ROLE_ID}"
VAULT_SECRET_ID="${VAULT_SECRET_ID}"
SECRET_PATH="${VAULT_SECRET_PATH:-secret/descendence/env}"
export VAULT_SKIP_VERIFY=true

echo "LOADING ALERT_MANAGER . . ."

if [ -z "$VAULT_ROLE_ID" ] || [ -z "$VAULT_SECRET_ID" ]; then
    echo "ERROR: VAULT_ROLE_ID and VAULT_SECRET_ID must be set"
    exit 1
fi

echo "Authenticating with Vault..."
VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$VAULT_ROLE_ID" secret_id="$VAULT_SECRET_ID")
export VAULT_TOKEN

echo "Fetching discord_hook from Vault..."
DISCORD_HOOK=$(vault kv get -field=DISCORD_HOOK "$SECRET_PATH")

if [ -z "$DISCORD_HOOK" ]; then
    echo "ERROR: Failed to fetch discord_hook from Vault"
    exit 1
fi

echo "Updating alertmanager configuration..."
sed -i "s|DISCORD_HOOK|${DISCORD_HOOK}|g" /etc/alertmanager/alertmanager.yml

echo "Starting Alertmanager . . ."
exec /bin/alertmanager "$@"
