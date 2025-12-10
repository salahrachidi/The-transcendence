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

# Remove "down" from here so it does not shutdown frontend container
up_backend:
	@docker compose up backend -d --build

up_nginx: 
	docker compose up nginx-waf -d --build


up:
	@docker compose up -d --build

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

vault: bind_mounts
	@echo "Starting Vault..."
	@docker compose up -d vault && bash ./secrets/role_creds.txt; docker compose up -d vault-init --build
	@echo "run hadi 3fk ila bghiti tkhdm b setter-getter: source ./secrets/role_creds.txt | then make up please"
	@echo "Vault initialized and configured"

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

# vault-get:
# 	@bash -c 'if [ -z "$(filter-out $$@,$(MAKECMDGOALS))" ]; then \
# 		echo "Usage: make vault-get SECRET_KEY"; \
# 		echo "Example: make vault-get DATABASE_PASSWORD"; \
# 		exit 1; \
# 	fi; \
# 	if [ ! -f .env ]; then \
# 		echo ".env file not found"; \
# 		exit 1; \
# 	fi; \
# 	source ./secrets/role_creds.txt; \
# 	bash hashicorpvault/getter_setter/get_secret.sh $$ROLE_ID $$SECRET_ID secret/descendence/env $(filter-out $$@,$(MAKECMDGOALS))'

# vault-set:
# 	@bash -c 'if [ -z "$(filter-out $$@,$(MAKECMDGOALS))" ]; then \
# 		echo "Usage: make vault-set KEY=VALUE [KEY2=VALUE2 ...]"; \
# 		echo "Example: make vault-set API_KEY=abc123 DB_PASS=secret"; \
# 		exit 1; \
# 	fi; \
# 	if [ ! -f .env ]; then \
# 		echo ".env file not found"; \
# 		exit 1; \
# 	fi; \
# 	source .env; \
# 	bash hashicorpvault/getter_setter/set_secret.sh $$ROLE_ID $$SECRET_ID secret/descendence/env $(filter-out $$@,$(MAKECMDGOALS))'

vault-restart:
	@echo "Restarting Vault..."
	@docker compose restart vault
	@sleep 3
	@$(MAKE) vault-unseal

# hh
%:
	@:
# hh

.PHONY: vault vault-status vault-unseal vault-login vault-clean vault-get vault-set vault-restart