push:
	@echo -n "enter a commit message: "
	@git add . && read commit && git commit -m "$$commit" && git push

frontend:
	@echo "Frontend building..."
	@docker compose up -d frontend

fedev:
	@echo "Frontend building devmode..."
	@docker compose up -d fedev

clean_all: vault-clean
	@read -p "This will remove all containers and prune the system. Continue? [Y/n]: " confirm; \
	if [ -z "$$confirm" ] || [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ]; then \
		echo "Cleaning Docker system..."; \
		docker rm $$(docker ps -aq) -f; \
		docker system prune -af; \
		docker volume rm $$(docker volume ls -q); \
	else \
		echo "Cancelled."; \
	fi

clean_front:
	@rm -rf ./frontend/.next ./frontend/node_modules

up_backend:
	@docker compose up backend -d --build

up_nginx: 
	docker compose up nginx-waf -d --build


up: vault
#	//Automate vault init if not initialized
	@echo "Checking for Vault initialization..."
	@if [ ! -f secrets/role_creds.txt ]; then \
		echo "Vault not initialized or credentials missing. Running vault-init..."; \
		$(MAKE) vault-init; \
		echo "Waiting for credentials to be generated..."; \
		while [ ! -f secrets/role_creds.txt ]; do sleep 1; done; \
	fi
	@echo "Starting Application with Vault Credentials..."
	@bash -c 'source secrets/role_creds.txt && docker compose up -d --build'

down:
	docker compose down --remove-orphans -v

stop:
	@docker compose stop

build: down
	docker compose build

rebuild: down
	docker compose build --no-cache

bind_mounts:
	@echo "creating docker volume bind mounts . . ."
	@mkdir -p hashicorpvault/vault-data hashicorpvault/vault-logs hashicorpvault/vault-config
# 	@chmod -R 776 hashicorpvault/vault-data hashicorpvault/vault-logs hashicorpvault/vault-config
	@mkdir -p uploads database secrets

logs:
	docker compose logs -f

ps:
	docker compose ps


# vault shit

chmod:
	@chmod -R 776 hashicorpvault

vault: bind_mounts chmod
	@echo "Starting Vault..."
	@docker compose --profile vault up -d vault

vault-init:
	@echo "seeding Vault..."
	@docker compose --profile vault up -d vault-init --build

vault-status:
	@echo "Vault Status:"
	@docker exec -e VAULT_SKIP_VERIFY=true vault vault status || echo "Vault is sealed or not initialized" 

vault-unseal:
	@echo "Unsealing Vault..."                                                                              
	@bash -c 'if [ -f vault-keys.json ]; then \
		jq -r ".unseal_keys_hex[] // .keys[]" ./vault-keys.json | head -n 3 | while read key; do \
			docker exec -e VAULT_SKIP_VERIFY=true vault vault operator unseal $$key > /dev/null; \
		done; \
		echo "Vault unsealed"; \
	else \
		echo "vault-keys.json not found. Run make vault first."; \
	fi'

vault-login:
	@bash -c 'ROOT_TOKEN=$$(jq -r ".root_token" ./vault-keys.json); \
		vault login "$$ROOT_TOKEN"'

vault-clean:
	@echo "Cleaning Vault data..."
	@docker compose stop vault
	@rm -rf hashicorpvault/vault-data/* hashicorpvault/vault-logs/*
	@rm -f ./vault-keys.json ./secrets/*
	@echo "Vault data cleaned"

vault-restart:
	@echo "Restarting Vault..."
	@docker compose restart vault
	@sleep 3
	@$(MAKE) vault-unseal

# hh
%:
	@:
# hh

.PHONY: vault vault-status vault-unseal vault-login vault-clean vault-get vault-set vault-restart vault-init chmod