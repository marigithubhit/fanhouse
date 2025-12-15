# Quick Start Guide

Get FanHouse running in under 5 minutes.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 15+ installed and running
- Git

## Setup

### 1. Install Dependencies

```bash
# Install all dependencies (root, frontend, backend)
npm install
```

### 2. Configure Environment

**Backend:**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fanhouse
JWT_SECRET=your-secret-key-here
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
```

No changes needed for local development.

### 3. Create Database

```bash
# Using psql
createdb fanhouse

# Or manually in PostgreSQL
psql -U postgres
CREATE DATABASE fanhouse;
\q
```

### 4. Run Migrations

```bash
cd backend
npm run migrate
```

This creates tables and adds a default admin user:
- **Email**: `admin@fanhouse.com`
- **Password**: `admin123`

### 5. Start Development Servers

From the root directory:
```bash
npm run dev
```

This starts:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Quick Test

### 1. Login as Admin

1. Navigate to http://localhost:3000
2. Click "Sign In"
3. Enter admin credentials:
   - Email: `admin@fanhouse.com`
   - Password: `admin123`
4. You'll be redirected to the admin panel

### 2. Create a Creator Account

1. Logout (or use incognito window)
2. Go to "Create Account"
3. Enter details:
   - Email: `creator@test.com`
   - Username: `testcreator`
   - Password: `password123`
   - Select: **Creator**
4. After registration, you'll see the dashboard

### 3. Approve Creator (as Admin)

1. Login as admin
2. Go to Admin Panel
3. Find the creator you just created
4. Click "Approve"

### 4. Create a Post (as Creator)

1. Login as the creator
2. Click "Create Post"
3. Fill in:
   - Title: "My First Post"
   - Content: "Hello world!"
   - Access Type: Choose any
4. Click "Create Post"

### 5. Create a Fan Account

1. Register as a new user
2. Select: **Fan**
3. Browse creators and posts

## Docker Quick Start

If you prefer Docker:

```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec backend npm run migrate

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Troubleshooting

### Database Connection Error

**Error**: `Could not connect to database`

**Solution**:
1. Make sure PostgreSQL is running:
   ```bash
   # Check status
   pg_isready

   # Start if needed (varies by OS)
   brew services start postgresql  # macOS
   sudo service postgresql start   # Linux
   ```

2. Verify connection string in `backend/.env`

### Port Already in Use

**Error**: `Port 3000/3001 already in use`

**Solution**:
```bash
# Find process using port
lsof -ti:3000  # or :3001

# Kill process
kill -9 <PID>
```

Or change ports in:
- `backend/.env` (PORT=3001)
- `frontend/.env.local` (update API_URL)

### Migration Failed

**Error**: `Migration failed`

**Solution**:
1. Drop and recreate database:
   ```bash
   dropdb fanhouse
   createdb fanhouse
   cd backend && npm run migrate
   ```

## Next Steps

- Read [README.md](./README.md) for detailed documentation
- Review [ARCHITECTURE.md](./ARCHITECTURE.md) for technical deep-dive
- Check API endpoints in README
- Explore the codebase structure

## Common Commands

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Frontend only
npm run dev:backend      # Backend only

# Build
npm run build            # Build both
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Database
cd backend
npm run migrate          # Run migrations

# Docker
docker-compose up -d     # Start containers
docker-compose down      # Stop containers
docker-compose logs -f   # View logs
```

## Default Accounts

After migration, you'll have:

**Admin**
- Email: `admin@fanhouse.com`
- Password: `admin123`
- Access: Full admin panel

## Support

Issues? Check:
1. [README.md](./README.md) - Full documentation
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details
3. GitHub Issues - Report problems
