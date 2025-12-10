storage "file" {
  path = "/vault/data"
}

# Listener - how Vault accepts connections
listener "tcp" {
  address     = "0.0.0.0:8200"
  
  tls_disable = 0
  tls_cert_file = "/vault/config/vault.crt"
  tls_key_file  = "/vault/config/vault.key"
  tls_require_and_verify_client_cert = false
}

ui = true

api_addr = "https://0.0.0.0:8200"

cluster_addr = "https://0.0.0.0:8201"

# Disable mlock (for Docker, only if IPC_LOCK is not working)
# disable_mlock = true

log_level = "info"

max_lease_ttl = "1337h"

default_lease_ttl = "1337h"