# Deployment Guide

How to get BestChoice running on a production server, from a bare Ubuntu box to a live site.

The repo ships a Docker Compose stack — Postgres, Django, Next.js, and nginx on one host. That is the supported path and what every file in this repo is wired for. [Alternative topologies](#alternative-topologies) at the end covers splitting pieces onto managed services.

**Read [ENVIRONMENT.md](ENVIRONMENT.md) alongside this.** Most failed deploys are a missing or misplaced environment variable, and that file explains each one.

---

## What runs where

```
                        ┌─────────────── your server ────────────────┐
                        │                                            │
  visitor ──── :443 ────┼──▶ nginx ──┬──▶ /api/    ──▶ Django :8000  │
                        │            │    /admin/                     │
                        │            │                               │
                        │            ├──▶ /static/ ──▶ static_volume │
                        │            │                               │
                        │            └──▶ /        ──▶ Next.js :3000 │
                        │                                            │
                        │                 Django ──▶ Postgres :5432  │
                        └────────────────────────────────────────────┘
                                          │
  product images ◀──── CloudFront ◀────── S3 (outside the server)
```

Everything is served from **one domain**. `nginx` terminates TLS and routes by path: `/api/` and `/admin/` to Django, everything else to Next.js. There is no `api.` subdomain.

Only nginx binds a public port. Django and Next.js bind to `127.0.0.1` so you can curl them from the host for debugging, but they are not reachable from the internet. Postgres and Redis have no host ports at all.

Product images are **not** served from the server — they go to S3 (optionally fronted by CloudFront). The backend refuses to start in production without a bucket, because Django does not serve local `media/` when `DEBUG=False` and every image would 404 silently. See [ENVIRONMENT.md](ENVIRONMENT.md#image-storage-s3).

---

## Before you start

Have these ready. Each one is a real blocker — the first three stop the stack from starting at all.

| | What | Where to get it |
|---|---|---|
| 1 | A domain with an **A record** pointing at the server's IP | Your registrar. DNS must resolve *before* you request certificates. |
| 2 | An **S3 bucket** + IAM access key | [ENVIRONMENT.md → S3](ENVIRONMENT.md#image-storage-s3) |
| 3 | A **Google OAuth client ID** | [ENVIRONMENT.md → Google sign-in](ENVIRONMENT.md#google-sign-in). Customers cannot log in without it. |
| 4 | **Razorpay** key id + secret | [ENVIRONMENT.md → Payments](ENVIRONMENT.md#payments-razorpay). Needed to take money; the site otherwise works. |
| 5 | An **SMTP** host, user, password | Optional. Without it, order emails are silently skipped. |

Server: 2 vCPU / 4 GB RAM is comfortable for launch. 1 GB is not — the Next.js build alone will OOM.

---

## 1. Prepare the server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose-v2 git
sudo systemctl enable --now docker
```

Let your user run Docker without sudo (log out and back in for it to take effect):

```bash
sudo usermod -aG docker "$USER"
```

Allow only SSH and web traffic:

```bash
sudo ufw allow OpenSSH && sudo ufw allow 80 && sudo ufw allow 443 && sudo ufw --force enable
```

---

## 2. Get the code and configure it

```bash
git clone <your-repo-url> bestchoice && cd bestchoice
```

```bash
cp .env.example .env
```

Now edit `.env`. Every variable is documented inline there and in detail in [ENVIRONMENT.md](ENVIRONMENT.md). At minimum you must set `DOMAIN`, `DJANGO_SECRET_KEY`, `DB_PASSWORD`, the three `AWS_*` values, and `GOOGLE_OAUTH_CLIENT_ID` — Compose refuses to start without the secret key, DB password, and bucket name.

Generate the secret key:

```bash
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Check your values resolve the way you expect before building anything:

```bash
docker compose config | grep -E "DJANGO_ALLOWED_HOSTS|CORS_ALLOWED|NEXT_PUBLIC_API_URL|DOMAIN"
```

---

## 3. Get a TLS certificate

nginx will not start without a certificate at the path it expects, and Certbot cannot validate a domain that nothing is answering on. Break the circle by serving the ACME challenge from a throwaway container first.

```bash
mkdir -p certbot/conf certbot/www
```

```bash
docker run --rm -p 80:80 -v "$PWD/certbot/conf:/etc/letsencrypt" -v "$PWD/certbot/www:/var/www/certbot" certbot/certbot certonly --standalone -d "$DOMAIN" -d "www.$DOMAIN" --email you@example.com --agree-tos --no-eff-email
```

Replace `$DOMAIN` and the email with real values. Add `--dry-run` first if you want to rehearse — Let's Encrypt rate-limits failed attempts on a real domain.

This writes to `certbot/conf/live/<domain>/`, which nginx mounts read-only. The `certbot` service in the compose stack renews it every 12 hours from then on.

---

## 4. Start the stack

```bash
docker compose up -d --build
```

First run takes a few minutes — it builds two images and the Next.js production bundle. The backend container migrates the database and runs `collectstatic` on startup, so there is no separate migration step.

Create your admin login:

```bash
docker compose run --rm backend python manage.py createsuperuser
```

Seed the category tree (the 5 top-level categories and 38 subcategories from the client brief — idempotent, safe to re-run):

```bash
docker compose run --rm backend python manage.py seed_categories
```

---

## 5. Verify it actually works

Don't trust "containers are up". Check each layer.

All five services `running`:

```bash
docker compose ps
```

Backend healthy:

```bash
curl -sf http://127.0.0.1:8000/api/health/ && echo OK
```

Site reachable over HTTPS with a valid certificate:

```bash
curl -sSI "https://$DOMAIN" | head -1
```

Google sign-in wired up — this must return `400 credential is required`. A `503` means `GOOGLE_OAUTH_CLIENT_ID` did not reach the backend:

```bash
curl -s -X POST "https://$DOMAIN/api/auth/google/" -H 'Content-Type: application/json' -d '{}'
```

The frontend bundle points at your domain, not `localhost` — the single most common broken deploy:

```bash
docker compose exec frontend sh -c "grep -rhoE 'https?://[a-zA-Z0-9._:-]+/api' .next/static | sort -u"
```

Then in a browser: load the storefront, open `/auth/login` and confirm a real Google button renders (not the "isn't configured" notice), sign in, and check `/admin/` accepts your superuser.

---

## 6. Razorpay webhook

In the Razorpay dashboard, *Settings → Webhooks → Add New Webhook*:

- URL `https://<your-domain>/api/payment/webhook/`
- Events: `payment.captured`, `payment.failed`
- Set a secret, and put the same value in `.env` as `RAZORPAY_WEBHOOK_SECRET`

Then `docker compose up -d backend` to pick it up. Signatures are verified and handling is idempotent, so a replayed webhook will not double-credit an order.

---

## 7. Automate backups

`backup-db.sh` dumps Postgres, gzips it, uploads to S3 if credentials are present, and prunes copies older than 30 days.

```bash
sudo mkdir -p /backups && sudo chown "$USER" /backups
```

```bash
(crontab -l 2>/dev/null; echo "0 2 * * * cd $PWD && ./backup-db.sh >> /var/log/bestchoice-backup.log 2>&1") | crontab -
```

Run it once by hand to confirm it works before relying on the schedule:

```bash
./backup-db.sh
```

If you skip the S3 upload, the backups live only on the machine they are protecting — losing the host loses the history with it.

---

## Routine operations

### Deploy a new version

```bash
./deploy.sh
```

Backs up the database, pulls `main`, rebuilds both images, restarts, and health-checks with a 60-second window — exiting non-zero and dumping logs if either service fails to come up.

The frontend rebuild is mandatory, not an optimisation: `NEXT_PUBLIC_*` values are compiled into the browser bundle, so a restart alone keeps serving the old ones.

### Automatic deployment on push

`.github/workflows/deploy.yml` runs `deploy.sh` on the server over SSH every time `main` is pushed. Set these three repository secrets once (**Settings → Secrets and variables → Actions**):

| Secret | Value |
|---|---|
| `SSH_HOST` | The server's hostname or IP |
| `SSH_USER` | `ubuntu` |
| `SSH_PRIVATE_KEY` | The full contents of the `.pem` key that can SSH in |

`gh secret set SSH_PRIVATE_KEY < path/to/key.pem` sets one from a file without ever pasting the key into a terminal argument or a chat.

A raw IP in `SSH_HOST` goes stale if the instance stops and starts without an Elastic IP attached — prefer the domain once DNS points at the server, or attach an Elastic IP so the address never changes.

Only one deploy runs at a time (`concurrency: production-deploy`); a push that lands mid-deploy queues instead of racing the one in progress. Trigger a redeploy without a new commit from the **Actions** tab → *Deploy to production* → **Run workflow**. Logs live there, not just in the SSH session that happened to run it.

### Logs

```bash
docker compose logs -f backend
```

### Django shell

```bash
docker compose run --rm backend python manage.py shell
```

### Scheduled maintenance commands

Three commands are meant to run on a schedule. None of them are wired into cron by default — set them up if you rely on the behaviour:

```bash
docker compose run --rm backend python manage.py expire_loyalty_points
```

Expires points past their 365-day window. Without it, points never actually expire and the balance drifts from what the rules promise. Daily is fine.

```bash
docker compose run --rm backend python manage.py give_birthday_bonus
```

Awards birthday bonus points. Must run daily to catch each day's birthdays.

```bash
docker compose run --rm backend python manage.py process_images
```

Regenerates the WebP thumbnail/small/medium/large variants. Only needed as a one-off backfill after bulk-importing products whose images skipped the upload pipeline.

Two more are one-offs rather than scheduled: `seed_pincodes` and `import_pincodes` populate Tamil Nadu delivery pincodes — see [DELIVERY.md](DELIVERY.md).

### Restore a backup

**Destructive** — this drops the live database. Take a fresh dump first if there is anything in there you might still want.

Stop the backend so nothing holds a connection open (an open connection blocks `DROP DATABASE`):

```bash
docker compose stop backend
```

Recreate the database, then load the dump:

```bash
docker compose exec -T db psql -U bestchoice -d postgres -c "DROP DATABASE IF EXISTS bestchoice_db;" -c "CREATE DATABASE bestchoice_db OWNER bestchoice;"
```

```bash
gunzip -c /backups/bestchoice_YYYYMMDD_HHMMSS.sql.gz | docker compose exec -T db psql -U bestchoice -d bestchoice_db
```

```bash
docker compose start backend
```

### Change an environment variable

```bash
docker compose up -d --build
```

Editing `.env` requires a `--build` if you touched anything that feeds a `NEXT_PUBLIC_*` build arg (`DOMAIN`, `GOOGLE_OAUTH_CLIENT_ID`, `RAZORPAY_KEY_ID`, `WHATSAPP_NUMBER`). Backend-only values need just a restart, but `--build` is always safe.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Backend exits immediately, `ImproperlyConfigured: AWS_STORAGE_BUCKET_NAME must be set` | Working as designed — set a real bucket. Django will not serve local `media/` in production, so images would 404 silently. |
| `POST /api/auth/google/` returns `503` | `GOOGLE_OAUTH_CLIENT_ID` missing from `.env`. Nobody can log in. |
| Google button shows "isn't configured yet" | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` was not baked in. Rebuild: `docker compose up -d --build frontend`. |
| Site loads, every API call fails | The bundle has the wrong API URL — check with the bundle-grep above — or the browser's origin is not in `CORS_ALLOWED_ORIGINS`. |
| `400 Bad Request` on every page | Host header not in `DJANGO_ALLOWED_HOSTS`. Driven by `DOMAIN`. |
| nginx won't start, "cannot load certificate" | Step 3 did not complete, or `DOMAIN` doesn't match the certificate directory name under `certbot/conf/live/`. |
| Payment popup opens then errors | Razorpay keys are placeholders or test keys against a live account. |
| Order emails never arrive | Email is sent `fail_silently=True`. Check `EMAIL_HOST`, and note `EMAIL_USE_TLS` is case-sensitive — `true` is not `True`. |
| Frontend build killed during deploy | Out of memory. Needs ~2 GB; add swap or a bigger instance. |

To see what the backend actually loaded:

```bash
docker compose exec backend python manage.py shell -c "from django.conf import settings; print('DEBUG', settings.DEBUG); print('HOSTS', settings.ALLOWED_HOSTS); print('BUCKET', repr(settings.AWS_STORAGE_BUCKET_NAME)); print('GOOGLE', bool(settings.GOOGLE_OAUTH_CLIENT_ID))"
```

---

## Alternative topologies

The single-host stack is the supported path. Common variations, and what changes:

**Managed Postgres (RDS, Neon, Supabase).** Drop the `db` service, point `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/`DB_PASSWORD` at the managed instance, and remove the `depends_on: db` condition from `backend`. You get automated backups and point-in-time recovery, and `backup-db.sh` becomes redundant.

**Frontend on Vercel.** Deploy `frontend/` as its own Vercel project with root directory `frontend`. Set the `NEXT_PUBLIC_*` values in Vercel's dashboard, not `.env`. Then drop the `frontend` service and its nginx `location /` block, and point DNS at Vercel with the backend on an `api.` subdomain — which means adding an `api.` server block to the nginx template and putting both origins in `CORS_ALLOWED_ORIGINS`. You gain a global CDN and preview deploys; you lose the single-domain setup this repo is wired for.

**Redis.** The compose stack runs Redis 7, but no application code uses it — no cache backend, no Celery broker. It is there for future caching or background jobs. Removing the service today changes nothing.
