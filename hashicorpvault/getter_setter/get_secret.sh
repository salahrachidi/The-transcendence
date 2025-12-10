#!/bin/bash
set -e

VAULT_ADDR="https://localhost:8200"
ROLE_ID="$1"
SECRET_ID="$2"
SECRET_PATH="${3:-secret/descendence/env}"

shift 3

export VAULT_ADDR
export VAULT_SKIP_VERIFY=true

if [ -z "$ROLE_ID" ] || [ -z "$SECRET_ID" ]; then
    echo "Usage: $0 <role_id> <secret_id> [secret_path] [key1 key2 ...]"
    exit 1
fi

VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID")
export VAULT_TOKEN

SECRETS=$(vault kv get -format=json "$SECRET_PATH" | jq -r '.data.data')

if [ $# -gt 0 ]; then
    for key in "$@"; do
        echo "$SECRETS" | jq -r --arg k "$key" '.[$k] // empty'
    done
else
    echo "$SECRETS"
fi
