#!/bin/bash
set -e

BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="bestchoice_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

docker-compose exec -T db pg_dump -U bestchoice bestchoice_db | gzip > $BACKUP_DIR/$FILENAME

echo "Backup saved: $BACKUP_DIR/$FILENAME"
echo "Size: $(du -h $BACKUP_DIR/$FILENAME | cut -f1)"

# Upload to S3 (optional)
if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$AWS_STORAGE_BUCKET_NAME" ]; then
    aws s3 cp $BACKUP_DIR/$FILENAME s3://$AWS_STORAGE_BUCKET_NAME/backups/$FILENAME
    echo "Backup uploaded to S3"
fi

# Cleanup old backups
find $BACKUP_DIR -name "bestchoice_*.sql.gz" -mtime +$RETENTION_DAYS -delete
echo "Cleaned up backups older than $RETENTION_DAYS days"
