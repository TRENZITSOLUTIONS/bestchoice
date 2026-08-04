#!/bin/bash
# Dump the Postgres database, gzip it, optionally push to S3, prune old copies.
# Intended for cron. See docs/DEPLOYMENT.md for the schedule and restore steps.
set -euo pipefail

cd "$(dirname "$0")"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="bestchoice_$TIMESTAMP.sql.gz"

mkdir -p "$BACKUP_DIR"

docker compose exec -T db pg_dump -U bestchoice bestchoice_db | gzip > "$BACKUP_DIR/$FILENAME"

echo "Backup saved: $BACKUP_DIR/$FILENAME"
echo "Size: $(du -h "$BACKUP_DIR/$FILENAME" | cut -f1)"

# Off-site copy. A backup that only exists on the server it protects is not a
# backup - if this is skipped, note that losing the host loses the history too.
if [ -f .env ]; then
    # shellcheck disable=SC1091
    set -a; . ./.env; set +a
fi

if [ -n "${AWS_ACCESS_KEY_ID:-}" ] && [ -n "${AWS_STORAGE_BUCKET_NAME:-}" ]; then
    if command -v aws > /dev/null 2>&1; then
        aws s3 cp "$BACKUP_DIR/$FILENAME" "s3://$AWS_STORAGE_BUCKET_NAME/backups/$FILENAME"
        echo "Uploaded to s3://$AWS_STORAGE_BUCKET_NAME/backups/$FILENAME"
    else
        echo "WARNING: aws CLI not installed - backup is local only."
    fi
else
    echo "WARNING: AWS credentials not set - backup is local only."
fi

find "$BACKUP_DIR" -name "bestchoice_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Pruned backups older than $RETENTION_DAYS days"
