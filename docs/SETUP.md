# Developer Setup Guide

## Prerequisites

- Python 3.9+ (the Docker image and local venv both use 3.9)
- Node.js 20+ (Next.js 16; the Docker image uses `node:20-alpine`)
- PostgreSQL 15+ — required, there is no SQLite fallback even for tests
- Git

Prefer to skip all of this? `docker compose up -d --build` brings the whole stack up
instead — see [DEPLOYMENT.md](DEPLOYMENT.md). The steps below are for working on the
code directly, with hot reload.

## 1. Clone & Install

```bash
git clone <repo-url> bestchoice
cd bestchoice
```

### Backend

```bash
cd backend

# Create virtual environment
python3.9 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## 2. Database Setup

```bash
# Create database (as postgres superuser)
createdb bestchoice_db

# If you need to create the user
createuser bestchoice --createdb --pwprompt
# Enter password when prompted

# Grant ownership
psql -c "ALTER DATABASE bestchoice_db OWNER TO bestchoice;"
```

## 3. Environment Variables

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```ini
DJANGO_SECRET_KEY=django-insecure-dev-key-change-in-production
DJANGO_DEBUG=True
DB_NAME=bestchoice_db
DB_USER=bestchoice
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
GOOGLE_OAUTH_CLIENT_ID=your-client-id.apps.googleusercontent.com
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

Leave S3 unset for local work — with `DJANGO_DEBUG=True`, images go to `backend/media/`
and are served at `/media/`. (Production is the opposite: it refuses to start without a bucket.)

To get Razorpay test keys:
1. Sign up at https://razorpay.com
2. Dashboard → Settings → API Keys
3. Generate test key

To get a Google client ID:
1. [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create credentials → OAuth client ID → **Web application**
3. Add `http://localhost:3000` as an authorized JavaScript origin
4. Leave authorized redirect URIs empty — this flow never redirects

### Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` must be the **same value** as the backend's
`GOOGLE_OAUTH_CLIENT_ID`, or token verification fails. Leave it empty and
`/auth/login` shows a "not configured" notice instead of a sign-in button.

Next.js reads `.env.local` at startup and inlines `NEXT_PUBLIC_*` into the bundle —
`npm run dev` picks up edits automatically, but a production `npm run build` bakes in
whatever was set at build time. Full reference: [ENVIRONMENT.md](ENVIRONMENT.md).

## 4. Run Migrations & Seed

```bash
cd backend
source venv/bin/activate

# Apply migrations
python manage.py migrate

# Seed data
python manage.py seed_categories
python manage.py seed_pincodes

# Create admin user (this is also your /staff/login account)
python manage.py createsuperuser

# Run tests - expect 124 passing
python manage.py test
```

There is no sample-product seeder. Add products through Django Admin at
http://localhost:8000/admin/, or bulk-import a CSV — see [INVENTORY-SETUP.md](INVENTORY-SETUP.md).

## 5. Start Development Servers

### Backend (Terminal 1)

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

API available at http://localhost:8000/api/

Django Admin at http://localhost:8000/admin/

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend at http://localhost:3000

## 6. Verify Everything Works

### Backend health

```bash
curl http://localhost:8000/api/products/ | python -m json.tool
# Should return paginated product list (empty or seeded)
```

### Auth flow

Customers sign in with Google only — there is no password registration. Set `GOOGLE_OAUTH_CLIENT_ID`
(backend) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (frontend) to the same Google OAuth **Web application**
client ID, with `http://localhost:3000` as an authorized JavaScript origin for local dev.

```bash
# Customer sign-in — needs a real Google ID token, so this is easiest to exercise
# through the frontend at http://localhost:3000/auth/login
curl -X POST http://localhost:8000/api/auth/google/ \
  -H "Content-Type: application/json" \
  -d '{"credential":"<google_id_token>"}'

# Staff sign-in (create the account first with: python manage.py createsuperuser)
curl -X POST http://localhost:8000/api/auth/staff/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@bestchoice.in","password":"yourpassword"}'
```

### Delivery check

```bash
curl http://localhost:8000/api/delivery/check/600001/
```

### Frontend

Open http://localhost:3000 — home page should load with no console errors.

## 7. Useful Commands

### Management Commands

```bash
# Seed categories
python manage.py seed_categories

# Seed pincodes (388 Tamilnadu pincodes)
python manage.py seed_pincodes

# Import pincodes from CSV
python manage.py import_pincodes path/to/pincodes.csv

# Generate sample CSV for pincode import
python manage.py import_pincodes --sample

# Clear and re-import pincodes
python manage.py import_pincodes path/to/file.csv --clear

# Award birthday bonus (points to users whose birthday is today) - run daily in prod
python manage.py give_birthday_bonus

# Expire loyalty points past their 365-day window - run daily in prod
python manage.py expire_loyalty_points

# Optional: reprocess existing product images (new uploads are processed automatically)
python manage.py process_images
```

### Django

```bash
# Create a new app
python manage.py startapp <app_name>

# Make migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Show SQL for a migration
python manage.py sqlmigrate <app> <migration_number>

# Django shell
python manage.py shell

# Test email config
python manage.py sendtestemail test@example.com
```

### Git Workflow

```bash
# Make small, focused commits
git add backend/products/models/product.py
git commit -m "Added Product model with pricing and stock fields"

# Never mix unrelated changes
git add backend/cart/
git commit -m "Added Cart and CartItem models"
```

## 8. Common Issues

### `psycopg2` install fails

```bash
# macOS
brew install postgresql

# Ubuntu
sudo apt install libpq-dev python3-dev
```

### Port already in use

```bash
# Find what's using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>
```

### Frontend can't connect to backend

- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check CORS: backend allows `http://localhost:3000`

### Images not loading

- Without S3: images are local, check `backend/media/` exists
- With S3: check `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are set

### Razorpay "amount invalid"

- Amount must be in paise (₹100 = 10000 paise)
- Minimum amount: ₹1 (100 paise)

## 9. Code Style

### Python

```bash
# Install dev dependencies
pip install flake8 black isort

# Check code
flake8 backend/
black --check backend/
isort --check backend/
```

### TypeScript

```bash
cd frontend
npm run lint
npx tsc --noEmit
```

There is no `typecheck` script — `package.json` defines only `dev`, `build`, `start`, and `lint`.
Run `npx tsc --noEmit` directly for type checking.
