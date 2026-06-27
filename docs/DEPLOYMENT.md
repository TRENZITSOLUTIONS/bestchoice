# Deployment Guide

## Architecture

| Service | Recommended Provider | Purpose |
|---|---|---|
| Frontend | Vercel (Pro) | Next.js SSR + static assets |
| Backend | Railway / AWS EC2 / DigitalOcean | Django API server |
| Database | AWS RDS / Railway Postgres | PostgreSQL |
| Cache | Upstash / Redis Cloud | Redis (optional) |
| Images | AWS S3 + CloudFront | Image storage + CDN |
| Domain | Cloudflare DNS | DNS, SSL, DDoS protection |
| Monitoring | Sentry | Error tracking |
| Uptime | Better Uptime / UptimeRobot | Health checks |

## Prerequisites

1. Domain name (e.g., `bestchoice.in`)
2. Cloudflare account (DNS management)
3. Razorpay live account (KYC completed)
4. AWS account (S3 + CloudFront)
5. Vercel account (frontend hosting)
6. Railway / EC2 account (backend hosting)

---

## 1. Backend Setup

### Server Requirements

- Ubuntu 22.04+
- Python 3.9+
- PostgreSQL 15+
- Nginx
- Supervisor or systemd

### Steps

```bash
# Install system dependencies
sudo apt update
sudo apt install -y python3.9 python3.9-venv python3-dev libpq-dev nginx supervisor

# Create deploy user
sudo adduser --disabled-password deploy
sudo usermod -aG sudo deploy
```

### Deploy Script

Create `/opt/bestchoice/deploy.sh`:

```bash
#!/bin/bash
set -e

cd /opt/bestchoice/backend

# Activate venv
source venv/bin/activate

# Pull latest
git pull origin main

# Install deps
pip install -r requirements.txt

# Migrate DB
python manage.py migrate

# Collect static
python manage.py collectstatic --noinput

# Restart services
sudo supervisorctl restart bestchoice-gunicorn
sudo systemctl reload nginx

# Health check
sleep 3
curl -f http://localhost:8000/admin/ || exit 1
echo "Deploy successful"
```

### Gunicorn Config

Create `/etc/supervisor/conf.d/bestchoice.conf`:

```
[program:bestchoice-gunicorn]
directory=/opt/bestchoice/backend
command=/opt/bestchoice/backend/venv/bin/gunicorn config.wsgi:application \
    --workers 4 \
    --worker-class sync \
    --bind 127.0.0.1:8000 \
    --timeout 120 \
    --access-logfile /var/log/bestchoice/access.log \
    --error-logfile /var/log/bestchoice/error.log
user=deploy
autostart=true
autorestart=true
stopwaitsecs=30
environment=
    DJANGO_SETTINGS_MODULE="config.settings",
    DJANGO_SECRET_KEY="<secret>",
    DJANGO_DEBUG="False",
    DJANGO_ALLOWED_HOSTS="api.bestchoice.in,localhost",
    DB_NAME="bestchoice",
    DB_USER="bestchoice",
    DB_PASSWORD="<password>",
    DB_HOST="<rds-endpoint>",
    DB_PORT="5432",
    RAZORPAY_KEY_ID="rzp_live_xxxx",
    RAZORPAY_KEY_SECRET="<secret>",
    AWS_ACCESS_KEY_ID="<key>",
    AWS_SECRET_ACCESS_KEY="<secret>",
    AWS_STORAGE_BUCKET_NAME="bestchoice-images",
    AWS_CLOUDFRONT_DOMAIN="https://dxxx.cloudfront.net",
    CORS_ALLOWED_ORIGINS="https://bestchoice.in,https://www.bestchoice.in"
```

### Nginx Config

Create `/etc/nginx/sites-available/bestchoice`:

```nginx
server {
    listen 80;
    server_name api.bestchoice.in;

    location /static/ {
        alias /opt/bestchoice/backend/staticfiles/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /opt/bestchoice/backend/media/;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}

# Redirect www
server {
    listen 80;
    server_name www.api.bestchoice.in;
    return 301 $scheme://api.bestchoice.in$request_uri;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bestchoice /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### SSL via Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.bestchoice.in
# Auto-renewal is configured automatically
```

---

## 2. Frontend Setup (Vercel)

### Build Configuration

Vercel auto-detects Next.js. Set these environment variables in Vercel dashboard:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://api.bestchoice.in/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_xxxx` |

### `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "rewrites": [
    {
      "source": "/sitemap.xml",
      "destination": "/api/sitemap"
    }
  ]
}
```

### Custom Domain

1. Go to Vercel dashboard → Project → Domains
2. Add `bestchoice.in` and `www.bestchoice.in`
3. Update Cloudflare DNS:
   - Type: CNAME
   - Name: @
   - Target: `cname.vercel-dns.com`
   - Proxy: DNS only (orange cloud off)

---

## 3. Database (AWS RDS)

```bash
# Create PostgreSQL instance
aws rds create-db-instance \
    --db-instance-identifier bestchoice-db \
    --db-instance-class db.t3.micro \
    --engine postgres \
    --master-username bestchoice \
    --master-user-password <password> \
    --allocated-storage 20 \
    --vpc-security-group-ids sg-xxxx

# Allow backend server access
# Add security group rule: PostgreSQL (5432) from backend server IP
```

### Backup

```bash
# Automated daily backup via cron
0 3 * * * pg_dump -h <rds-endpoint> -U bestchoice bestchoice | gzip > /backups/bestchoice_$(date +\%Y\%m\%d).sql.gz

# Retention: keep last 30 days
0 4 * * * find /backups -name "bestchoice_*.sql.gz" -mtime +30 -delete
```

---

## 4. S3 + CloudFront

### S3 Bucket

```bash
# Create bucket (must be globally unique)
aws s3api create-bucket \
    --bucket bestchoice-images \
    --region ap-south-1 \
    --create-bucket-configuration LocationConstraint=ap-south-1

# Block public access (CloudFront handles access)
aws s3api put-public-access-block \
    --bucket bestchoice-images \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

# CORS config
aws s3api put-bucket-cors \
    --bucket bestchoice-images \
    --cors-configuration '{
        "CORSRules": [{
            "AllowedOrigins": ["https://bestchoice.in", "https://www.bestchoice.in"],
            "AllowedMethods": ["GET"],
            "AllowedHeaders": ["*"],
            "MaxAgeSeconds": 3600
        }]
    }'
```

### CloudFront Distribution

```bash
# Create CloudFront distribution pointing to S3 bucket
aws cloudfront create-distribution \
    --origin-domain-name bestchoice-images.s3.ap-south-1.amazonaws.com \
    --default-root-object index.html

# Add CNAME: cdn.bestchoice.in
# SSL: Request ACM certificate for *.bestchoice.in (us-east-1)
# Price class: Asia Only (to reduce cost)
```

### IAM User for Django

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:ListBucket"],
      "Resource": ["arn:aws:s3:::bestchoice-images", "arn:aws:s3:::bestchoice-images/*"]
    }
  ]
}
```

---

## 5. Monitoring

### Health Check Endpoint

Backend exposes `/api/health/` — returns `{"status": "ok"}`.

### Sentry

```python
# Add to requirements.txt
sentry-sdk==2.0.0

# Add to settings.py
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

sentry_sdk.init(
    dsn=os.environ.get('SENTRY_DSN', ''),
    integrations=[DjangoIntegration()],
    traces_sample_rate=0.1,
    send_default_p2p=True,
)
```

### Uptime Checks

- Endpoint: `https://api.bestchoice.in/api/health/`
- Expected: HTTP 200, JSON `{"status": "ok"}`
- Alert via: Email + Slack

---

## 6. CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_db
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.9'
      - run: pip install -r backend/requirements.txt
      - run: python manage.py test
        env:
          DJANGO_SETTINGS_MODULE: config.settings
          DB_NAME: test_db
          DB_USER: test
          DB_PASSWORD: test
          DB_HOST: localhost
          DB_PORT: 5432
        working-directory: backend

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run lint
      - run: npm run build
        working-directory: frontend

  deploy-backend:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: /opt/bestchoice/deploy.sh

  deploy-frontend:
    needs: [test-backend, test-frontend]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 7. Post-Deploy Checklist

- [ ] Backend health check returns 200
- [ ] Frontend loads without CORS errors
- [ ] Razorpay test payment completes (use test card `4111 1111 1111 1111`)
- [ ] Admin dashboard accessible
- [ ] S3 image upload works
- [ ] CloudFront URLs resolve
- [ ] SSL certificates valid
- [ ] Scheduled DB backup runs
- [ ] Sentry reports no errors
- [ ] DNS propagation complete (check with `dig`)

## Production Settings

Add these to `settings.py` for production:

```python
# Security
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Whitenoise for static files
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

Add to `requirements.txt`:

```
gunicorn==22.0.0
whitenoise==6.6.0
sentry-sdk==2.0.0
django-redis==5.4.0
redis==5.0.0
```
