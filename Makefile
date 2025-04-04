#!/usr/bin/make
# Makefile readme: <https://www.gnu.org/software/make/manual/html_node/index.html#SEC_Contents>

.DEFAULT_GOAL := build
.MAIN := build

NODE_IMAGE = docker.io/library/node:20-bookworm
RUN_ARGS = --rm -v "$(shell pwd):/src:rw" \
	-t --workdir "/src" \
	-u "$(shell id -u):$(shell id -g)" \
	-e "NPM_CONFIG_UPDATE_NOTIFIER=false" \
	-e PATH="$$PATH:/src/node_modules/.bin" $(NODE_IMAGE)

install: ## Install all dependencies
	docker run $(RUN_ARGS) npm install

shell: ## Start shell into a container with node
	docker run -i $(RUN_ARGS) bash

dev: ## Start development server
	docker run -p "8787:8787/tcp" -i $(RUN_ARGS) npm run dev

gen fmt test lint build: ## Run the specified npm script
	docker run $(RUN_ARGS) npm run $@
