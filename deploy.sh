#!/bin/bash
# Deploy the current main branch. Run from the repo root on the server.
#
# Postgres is RDS (see infra/terraform/rds.tf), which takes its own automated
# daily backups - nothing for this script to dump locally.
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
    echo "ERROR: .env not found. Copy .env.example to .env and fill it in."
    exit 1
fi

echo "=== BestChoice deployment ==="

echo "1/5 Pulling latest code..."
git pull origin main

# Rebuilds both images. The frontend rebuild is required, not optional: the
# NEXT_PUBLIC_* values are compiled into the browser bundle at build time.
echo "2/5 Building images..."
docker compose build

# The backend container runs migrate and collectstatic itself on startup.
echo "3/5 Restarting services..."
docker compose up -d --remove-orphans

echo "4/5 Health check..."
# localhost, not 127.0.0.1: curl sets the Host header to whatever's in the URL,
# and Django's ALLOWED_HOSTS only lists "localhost" - hitting the raw loopback
# IP directly gets a 400 even though the container is perfectly healthy.
for i in $(seq 1 30); do
    if curl -sf http://localhost:8000/api/health/ > /dev/null 2>&1; then
        echo "     backend OK"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "     backend FAILED - recent logs:"
        docker compose logs --tail=40 backend
        exit 1
    fi
    sleep 2
done

# Same retry loop as the backend check above - a single zero-retry attempt
# right after "Started" can lose a race against Next.js still binding its
# port, even when it comes up in well under a second.
for i in $(seq 1 30); do
    if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
        echo "     frontend OK"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "     frontend FAILED - recent logs:"
        docker compose logs --tail=40 frontend
        exit 1
    fi
    sleep 2
done

# Every rebuild leaves the previous backend/frontend image dangling (untagged,
# replaced by the new "latest") plus fresh build-cache layers - unbounded over
# repeated deploys otherwise. Only reachable after a successful health check,
# so a failed deploy leaves everything in place for debugging.
echo "5/5 Cleaning up old images..."
docker image prune -f > /dev/null
docker builder prune -f --filter until=72h > /dev/null

echo "=== Deployment complete ==="
