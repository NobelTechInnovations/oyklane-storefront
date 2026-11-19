# Storefront on AWS Lightsail (Docker)

Runs on the API's server (`ubuntu@13.200.105.217`) in `~/apps/oyklane-storefront`, behind the shared Caddy in `~/apps/proxy`
(server layout: `oyklane-api/deploy/aws.md`). Set up with `oyklane-api/deploy/frontends-setup.sh`.

- **Address:** *.oyklane.com and sellers' own domains.
- **Deploy:** every push to `main` runs `.github/workflows/deploy.yml` → `~/apps/bin/deploy-oyklane-storefront.sh` (pull, rebuild, restart).
  By hand: `~/apps/bin/deploy-oyklane-storefront.sh`.
- **Settings:** addresses are build arguments in `deploy/docker-compose.prod.yml` (edit and push).
  Shared secrets live in `~/apps/oyklane-storefront/.env` on the server, copied from the API's `.env` by the setup script.
- **HTTPS:** `~/apps/proxy/sites/oyklane-storefront.caddy` (copy of `deploy/oyklane-storefront.caddy`).
  Store addresses get certificates on demand: Caddy asks `/tls-check` first, so only real stores get one.
  DNS: `*.oyklane.com` A → `13.200.105.217`; a seller's domain: apex A → `13.200.105.217`, `www` CNAME → `domains.oyklane.com`.

## UAT
Branch `uat` → **https://uat-shop.oyklane.com** (`~/apps/oyklane-storefront-uat`, `deploy/docker-compose.uat.yml`), against the UAT API.
Every push to `uat` runs `.github/workflows/deploy-uat.yml` (secret `AWS_UAT_SSH_KEY`). Set up with `frontends-setup.sh --uat`.

## Useful
```bash
cd ~/apps/oyklane-storefront
docker compose -f deploy/docker-compose.prod.yml ps
docker compose -f deploy/docker-compose.prod.yml logs --since 1h web
```
