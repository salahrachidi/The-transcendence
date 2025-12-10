#!/bin/bash
set -e

VAULT_ADDR="https://localhost:8200"
ROLE_ID="$1"
SECRET_ID="$2"
SECRET_PATH="${3:-secret/data/mybitch/env}"
shift 3

export VAULT_ADDR
export VAULT_SKIP_VERIFY=true

if [ -z "$ROLE_ID" ] || [ -z "$SECRET_ID" ] || [ $# -eq 0 ]; then
    echo "Usage: $0 <role_id> <secret_id> [secret_path] key1=value1 key2=value2 ..."
    exit 1
fi

# Login with AppRole
VAULT_TOKEN=$(vault write -field=token auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID")
export VAULT_TOKEN

# Set secrets
vault kv put "$SECRET_PATH" "$@"
