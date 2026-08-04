# Environment Variables

Every environment variable the system reads, where it is read, what happens if you leave it out, and how to obtain a real value.

**There are three separate env files.** Which one you edit depends on how you are running things:

| File | Used by | Committed? |
|---|---|---|
| `.env` (repo root) | `docker-compose.yml` — the whole production stack | No. Copy from `.env.example` |
| `backend/.env` | Local Django dev only, if you use a loader like `direnv`/`python-dotenv` | No. Copy from `backend/.env.example` |
| `frontend/.env.local` | Local `npm run dev` | No. Copy from `frontend/.env.example` |

In Docker, the root `.env` is the only one that matters — compose injects values into the containers directly, and `backend/.env` / `frontend/.env.local` are not read.

---

## The one thing that trips people up

**Backend variables are read at runtime. Frontend `NEXT_PUBLIC_*` variables are compiled in at build time.**

Next.js replaces every `process.env.NEXT_PUBLIC_X` with a literal string when `npm run build` runs, because that code has to execute in the browser, where there is no environment. Consequences:

- Changing a `NEXT_PUBLIC_*` value requires **rebuilding**, not restarting: `docker compose up -d --build frontend`.
- In `docker-compose.yml` they are `build.args`, not `environment`. Setting them under `environment` looks right and does nothing for browser code.
- **Never put a secret in a `NEXT_PUBLIC_*` variable.** It ships to every visitor in plain text. The Razorpay *key id* and Google *client id* are public identifiers and are fine; the corresponding *secrets* are backend-only and must never gain a `NEXT_PUBLIC_` prefix.

---

## Backend (Django)

All read in [`backend/config/settings.py`](../backend/config/settings.py).

### Core

| Variable | Default | Required | Notes |
|---|---|---|---|
| `DJANGO_SECRET_KEY` | insecure dev key | **Yes, in prod** | Signs sessions and JWTs. Rotating it invalidates all existing sessions and tokens. Generate: `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `DJANGO_DEBUG` | `True` | **Set to `False` in prod** | Case-insensitive; anything other than `true` counts as false. `False` also switches on the security block below. |
| `DJANGO_ALLOWED_HOSTS` | `localhost,127.0.0.1` | **Yes, in prod** | Comma-separated, no scheme. A request with an unlisted `Host` header gets a 400. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:8000` | **Yes, in prod** | Comma-separated, **with** scheme. Must list the exact origin the browser loads the storefront from, or every API call fails CORS. |

Setting `DJANGO_DEBUG=False` automatically enables: HTTPS redirect, HSTS (1 year, includes subdomains, preload), secure + httponly session cookies, secure CSRF cookie, `nosniff`, and `X-Frame-Options: DENY`. It also trusts `X-Forwarded-Proto` from the proxy, which is what makes the redirect work behind nginx.

### Database

| Variable | Default | Required | Notes |
|---|---|---|---|
| `DB_NAME` | `bestchoice_db` | No | |
| `DB_USER` | `bestchoice` | No | |
| `DB_PASSWORD` | *(empty)* | **Yes** | |
| `DB_HOST` | `localhost` | No | `db` inside Docker (the compose service name) |
| `DB_PORT` | `5432` | No | |

PostgreSQL only — there is no SQLite fallback, including for tests. Tests create and drop `test_bestchoice_db` on the same server.

### Image storage (S3)

| Variable | Default | Required | Notes |
|---|---|---|---|
| `AWS_STORAGE_BUCKET_NAME` | *(empty)* | **Yes, in prod** | See the hard failure below |
| `AWS_ACCESS_KEY_ID` | *(empty)* | With a bucket | |
| `AWS_SECRET_ACCESS_KEY` | *(empty)* | With a bucket | |
| `AWS_S3_REGION_NAME` | `ap-south-1` | No | Mumbai. Change only if your bucket lives elsewhere. |
| `AWS_CLOUDFRONT_DOMAIN` | *(empty)* | No | Distribution domain without scheme. Set it and images are served from the CDN edge instead of S3 directly. |

**The backend refuses to start if `DJANGO_DEBUG=False` and `AWS_STORAGE_BUCKET_NAME` is empty** — it raises `ImproperlyConfigured` at import time. This is deliberate: Django only serves the local `media/` directory when `DEBUG=True`, so without a bucket every product image in production would 404 with nothing in the logs to explain it. Failing loudly at startup beats a silently broken catalogue. Tests are exempted.

With no bucket set and `DEBUG=True`, uploads go to local `media/` and are served at `/media/` — fine for development.

**Object ownership and public read.** Buckets created since ~April 2023 default
to *Bucket owner enforced* ownership, which disables ACLs outright. The app
never sets a per-object ACL (`AWS_DEFAULT_ACL = None`) — product images need to
be public, so grant that with a bucket policy instead:

1. Bucket → **Permissions** → *Block public access* → uncheck the two
   "...bucket policies" boxes (leave ACL-related ones checked; you have no ACLs).
2. **Bucket policy** → paste, replacing the bucket name:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }
   ```

**Credentials.** Leave `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` blank when
running on EC2 with an IAM instance role attached — boto3 only calls
`session.set_credentials()` when both are truthy, so an empty string correctly
falls through to the instance's role via the metadata service. Only fill them
in when running somewhere without an attachable role (local dev, a non-AWS host).

### Google sign-in

| Variable | Default | Required | Notes |
|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | *(empty)* | **Yes** — customers cannot log in without it | Verifies the ID token's audience so a token minted for another app is rejected |

Without it, `POST /auth/google/` returns `503 {"detail": "Google sign-in is not configured."}`. Customers have no other way in — Google is the only customer auth method. Staff can still sign in at `/staff/login`.

**Getting one:** [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) → Create credentials → OAuth client ID → **Web application**. Add every origin the site is served from as an *Authorized JavaScript origin* (`https://bestchoice.in`, `https://www.bestchoice.in`, and `http://localhost:3000` for dev). Leave *Authorized redirect URIs* empty — this flow returns the token to a JavaScript callback and never redirects. The resulting `...apps.googleusercontent.com` string goes in **both** `GOOGLE_OAUTH_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_CLIENT_ID`; they must match or verification fails.

The client *secret* is not used anywhere and does not need to be stored.

### Payments (Razorpay)

| Variable | Default | Required | Notes |
|---|---|---|---|
| `RAZORPAY_KEY_ID` | `rzp_test_xxxx` | **Yes, to take payments** | Public identifier; also needed by the frontend |
| `RAZORPAY_KEY_SECRET` | *(empty)* | **Yes** | **Secret.** Backend only |
| `RAZORPAY_WEBHOOK_SECRET` | *(empty)* | Yes, for webhooks | **Secret.** Verifies the webhook signature; unset means webhook calls are rejected |

From the Razorpay dashboard: *Settings → API Keys* for the pair, *Settings → Webhooks* for the webhook secret. Point the webhook at `https://<your-domain>/api/payment/webhook/`.

Leaving the placeholder in place means checkout reaches Razorpay and gets a gateway error, which the UI surfaces as "Payment gateway error. Please try again." Everything up to payment still works.

### Email

| Variable | Default | Required | Notes |
|---|---|---|---|
| `EMAIL_BACKEND` | console backend | No | Default prints emails to stdout. Compose sets the SMTP backend. |
| `EMAIL_HOST` | *(empty)* | No | |
| `EMAIL_PORT` | `587` | No | |
| `EMAIL_HOST_USER` | *(empty)* | No | |
| `EMAIL_HOST_PASSWORD` | *(empty)* | No | **Secret** |
| `EMAIL_USE_TLS` | `True` | No | See the gotcha below |
| `DEFAULT_FROM_EMAIL` | `noreply@bestchoice.in` | No | |

⚠️ **`EMAIL_USE_TLS` is case-sensitive.** It is compared against the exact string `True`, unlike `DJANGO_DEBUG` which is lowercased first. `EMAIL_USE_TLS=true` evaluates to **False** and TLS is silently off. Use `True`.

Order confirmation and shipping emails are sent with `fail_silently=True`, so a misconfigured mail server does not break checkout — the emails just never arrive, with nothing raised. If customers report missing emails, check these values first.

---

## Frontend (Next.js)

All `NEXT_PUBLIC_*` — build-time, browser-visible, never secret.

| Variable | Default | Required | Read in |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000/api` | **Yes, in prod** | [`lib/api.ts`](../frontend/src/lib/api.ts), [`sitemap.ts`](../frontend/src/app/sitemap.ts) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | *(unset)* | **Yes** | [`GoogleSignInButton.tsx`](../frontend/src/components/auth/GoogleSignInButton.tsx) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | *(unset)* | **Yes, to take payments** | Checkout page |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `919876543210` | Yes — the default is a placeholder | [`WhatsAppButton.tsx`](../frontend/src/components/WhatsAppButton.tsx) |
| `NEXT_PUBLIC_SITE_URL` | `https://bestchoice.in` | No | [`robots.ts`](../frontend/src/app/robots.ts), [`sitemap.ts`](../frontend/src/app/sitemap.ts) |

Notes:

- `NEXT_PUBLIC_API_URL` includes the `/api` suffix and no trailing slash. **Its default is `localhost:8000`** — miss it in a production build and the deployed site tries to call the visitor's own machine.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` unset renders a visible "Google sign-in isn't configured yet" notice on `/auth/login` rather than an empty page, so a misconfigured deploy is obvious rather than mysterious.
- `NEXT_PUBLIC_WHATSAPP_NUMBER` is country code + number, digits only, no `+` or spaces: `919876543210`. The default is a placeholder that points nowhere real.
- If external image hosts change, `images.remotePatterns` in [`next.config.ts`](../frontend/next.config.ts) also needs updating — `next/image` blocks unlisted hosts. It currently allows `localhost:8000/media/**`, `*.cloudfront.net`, and the S3 domains.

---

## Compose-only variables

Used by `docker-compose.yml` itself rather than by application code.

| Variable | Default | Notes |
|---|---|---|
| `DOMAIN` | `bestchoice.in` | Bare domain, no scheme or trailing slash. Single source of truth: it drives nginx `server_name` and the TLS certificate path, Django's `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS`, and the frontend's `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_SITE_URL`. |
| `WHATSAPP_NUMBER` | *(empty)* | Passed through to `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| `SERVER_IP` | *(unset)* | Optional. Adds the server's raw IP to `DJANGO_ALLOWED_HOSTS`, so you can reach the site by IP before DNS points at it. Remove once DNS is live — an IP in `ALLOWED_HOSTS` forever is a minor, avoidable attack surface. |
| `DJANGO_FORCE_HTTPS` | `True` | Only ever set to `False` temporarily. `SECURE_SSL_REDIRECT` normally forces every request to HTTPS in production — correct once TLS is live, but during the gap between pointing DNS at a fresh server and issuing its first certificate, nginx has no HTTPS listener yet, and forcing the redirect just breaks every request. Set back to `True` (or unset) the moment the certificate exists. |

`GOOGLE_OAUTH_CLIENT_ID` and `RAZORPAY_KEY_ID` are each used twice — once as backend runtime env, once as a frontend build arg — so you only set them once in `.env`.

Compose hard-fails with a readable message if `DJANGO_SECRET_KEY`, `DB_PASSWORD`, or `AWS_STORAGE_BUCKET_NAME` is missing, rather than starting a broken stack.

---

## Quick checks

Confirm what the backend actually loaded:

```bash
docker compose exec backend python manage.py shell -c "from django.conf import settings; print('DEBUG', settings.DEBUG); print('HOSTS', settings.ALLOWED_HOSTS); print('BUCKET', repr(settings.AWS_STORAGE_BUCKET_NAME)); print('GOOGLE', bool(settings.GOOGLE_OAUTH_CLIENT_ID))"
```

Confirm the right API URL got baked into the frontend bundle (should print your domain, never `localhost`):

```bash
docker compose exec frontend sh -c "grep -rhoE 'https?://[a-zA-Z0-9._:-]+/api' .next/static | sort -u"
```

Confirm Google sign-in is wired end to end (expects `400 credential is required`, **not** `503`):

```bash
curl -s -X POST https://your-domain/api/auth/google/ -H 'Content-Type: application/json' -d '{}'
```

---

## Secrets checklist

Never commit, never prefix with `NEXT_PUBLIC_`, rotate if exposed:

- `DJANGO_SECRET_KEY`
- `DB_PASSWORD`
- `AWS_SECRET_ACCESS_KEY`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `EMAIL_HOST_PASSWORD`

Safe to expose (they are public identifiers by design): `GOOGLE_OAUTH_CLIENT_ID`, `RAZORPAY_KEY_ID`, `AWS_CLOUDFRONT_DOMAIN`, `DOMAIN`.
