#!/bin/bash
set -e

echo "=== BestChoice Deployment ==="

# Load env
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
fi

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "1/6 Backing up database..."
mkdir -p $BACKUP_DIR
docker-compose exec -T db pg_dump -U bestchoice bestchoice_db | gzip > $BACKUP_DIR/bestchoice_$TIMESTAMP.sql.gz
echo "  Backup saved: $BACKUP_DIR/bestchoice_$TIMESTAMP.sql.gz"

echo "2/6 Pulling latest code..."
git pull origin main

echo "3/6 Building images..."
docker-compose build

echo "4/6 Running migrations..."
docker-compose run --rm backend python manage.py migrate --noinput

echo "5/6 Collecting static files..."
docker-compose run --rm backend python manage.py collectstatic --noinput

echo "6/6 Restarting services..."
docker-compose up -d --remove-orphans

# Health check
sleep 5
if curl -sf http://localhost:8000/api/health/ > /dev/null 2>&1; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed"
    exit 1
fi

if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
    echo "✅ Frontend health check passed"
else
    echo "❌ Frontend health check failed"
fi

echo "=== Deployment complete ==="

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "bestchoice_*.sql.gz" -mtime +30 -delete
