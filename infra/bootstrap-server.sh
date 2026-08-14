#!/bin/bash
# One-time setup for a fresh EC2 instance from the Terraform config in
# infra/terraform/ - installs Docker, clones the repo, and gets a TLS cert.
# Run this ONCE per new server, by hand, right after `terraform apply`.
#
# Usage (on the new server, after SSH'ing in as ubuntu):
#   curl -O https://raw.githubusercontent.com/<org>/bestchoice/main/infra/bootstrap-server.sh
#   chmod +x bootstrap-server.sh
#   REPO_URL=https://github.com/<org>/bestchoice.git DOMAIN=bestchoiceshopping.com ./bootstrap-server.sh
#
# Same steps as docs/DEPLOYMENT.md "Prepare the server", just scripted.
set -euo pipefail

: "${REPO_URL:?Set REPO_URL to the git clone URL}"
: "${DOMAIN:?Set DOMAIN to your domain, e.g. bestchoiceshopping.com}"

echo "=== 1/4 Installing Docker ==="
sudo apt update
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
echo "     Log out and back in (or run 'newgrp docker') for the group change to apply."

echo "=== 2/4 Firewall ==="
# Belt-and-suspenders alongside the security group Terraform already set up -
# only matters if this box is ever reached outside that security group.
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

echo "=== 3/4 Cloning the repo ==="
git clone "$REPO_URL" bestchoice
cd bestchoice

cat <<'EOF'

=== 4/4 Manual steps from here ===

This script stops here on purpose - the remaining steps need real values
(RDS endpoint, S3 bucket name, secrets) that only you have, from:
  terraform output rds_endpoint
  terraform output s3_bucket_name

1. Copy .env.example to .env and fill it in. Two things are DIFFERENT from
   the old server's .env:
     - DB_HOST must be the RDS endpoint (terraform output rds_endpoint),
       not "db"
     - AWS_STORAGE_BUCKET_NAME must be the new bucket name
   Generate fresh secrets (SECRET_KEY, DB_PASSWORD to match what you set
   in Terraform, etc.) - do not copy the old server's .env verbatim.

2. Edit docker-compose.yml:
     - Delete the whole "db:" service block - Postgres is RDS now, not a
       local container.
     - Remove "depends_on: [db]" (or the db entry within depends_on) from
       the backend service - nothing to wait on locally anymore.

3. Get a TLS certificate (only works once DNS actually points here) -
   replace DOMAIN_PLACEHOLDER below with your actual domain:
     docker run --rm -p 80:80 \
       -v "$PWD/certbot/conf:/etc/letsencrypt" \
       -v "$PWD/certbot/www:/var/www/certbot" \
       certbot/certbot certonly --standalone \
       -d "DOMAIN_PLACEHOLDER" -d "www.DOMAIN_PLACEHOLDER" \
       --email you@example.com --agree-tos --no-eff-email

4. Bring the stack up:
     docker compose up -d --build

5. One-time: restore the migrated database dump into RDS (see the main
   migration runbook), then create a superuser if this is a genuinely
   fresh database instead of a restored one:
     docker compose run --rm backend python manage.py createsuperuser

6. Point the GitHub Actions deploy secrets (server host + SSH key) at this
   box, so future pushes to main deploy here automatically.

See docs/DEPLOYMENT.md for the full detail behind each of these steps.
EOF
echo "(DOMAIN_PLACEHOLDER above means: $DOMAIN)"
