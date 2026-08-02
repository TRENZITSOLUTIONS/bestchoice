# Developer Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 22+
- PostgreSQL 15+
- Git

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
RAZORPAY_KEY_ID=rzp_test_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_test_secret
```

To get Razorpay test keys:
1. Sign up at https://razorpay.com
2. Dashboard → Settings → API Keys
3. Generate test key

### Frontend

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:

```ini
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxx
```

## 4. Run Migrations & Seed

```bash
cd backend
source venv/bin/activate

# Apply migrations
python manage.py migrate

# Seed data
python manage.py seed_categories
python manage.py seed_pincodes

# Create admin user
python manage.py createsuperuser

# (Optional) Seed sample products
python manage.py seed_products

# Run tests
python manage.py test
```

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

```bash
# Register a user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phone":"9876543210","password":"testpass123","first_name":"Test","last_name":"User"}'

# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'
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

# Award birthday bonus (100 points to users whose birthday is today)
python manage.py give_birthday_bonus

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
npm run typecheck
```
