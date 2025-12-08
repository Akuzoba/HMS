# Hospital Management System - Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Go to [railway.app](https://railway.app)** and sign up with GitHub

2. **Create a new project** → "Deploy from GitHub repo"

3. **Add PostgreSQL:**

   - Click "New" → "Database" → "PostgreSQL"
   - Railway auto-creates `DATABASE_URL`

4. **Deploy Backend:**

   - Click "New" → "GitHub Repo" → Select your repo
   - Set root directory: `backend`
   - Add environment variables:
     ```
     DATABASE_URL=<auto from PostgreSQL>
     JWT_SECRET=your-super-secret-key-change-this
     NODE_ENV=production
     PORT=3000
     ```

5. **Deploy Frontend:**

   - Click "New" → "GitHub Repo" → Select same repo
   - Set root directory: `frontend`
   - Add environment variable:
     ```
     VITE_API_URL=https://your-backend.railway.app/api
     ```

6. **Run migrations** (in Railway CLI or dashboard):
   ```bash
   npx prisma migrate deploy
   npx prisma db seed
   ```

---

### Option 2: Render.com (Free Tier Available)

1. **Database:** Create PostgreSQL on Render
2. **Backend:** New Web Service → Connect repo → Root: `backend`
3. **Frontend:** New Static Site → Connect repo → Root: `frontend`

Environment variables same as Railway.

---

### Option 3: VPS (DigitalOcean/Hetzner) - Most Control

**Cost:** $5-10/month for a VPS

```bash
# On your VPS (Ubuntu)
# 1. Install Docker
curl -fsSL https://get.docker.com | sh

# 2. Install Docker Compose
sudo apt install docker-compose-plugin

# 3. Clone your repo
git clone https://github.com/Akuzoba/HMS.git
cd HMS

# 4. Create production environment
cp backend/.env.example backend/.env
# Edit backend/.env with production values

# 5. Run with Docker Compose
docker compose up -d
```

---

## Docker Compose for VPS Deployment

Create this file at the project root:

```yaml
# docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: hms
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: hms
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://hms:${DB_PASSWORD}@postgres:5432/hms
      JWT_SECRET: ${JWT_SECRET}
      NODE_ENV: production
      PORT: 3000
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - /etc/letsencrypt:/etc/letsencrypt
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Environment Variables Reference

### Backend (.env)

```env
DATABASE_URL=postgresql://user:password@host:5432/hms
JWT_SECRET=generate-a-64-char-random-string
JWT_EXPIRES_IN=7d
NODE_ENV=production
PORT=3000
```

### Frontend (.env)

```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## Post-Deployment Checklist

- [ ] Run database migrations: `npx prisma migrate deploy`
- [ ] Seed initial data: `npm run db:seed`
- [ ] Set up SSL (Railway/Render do this automatically)
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring (optional: UptimeRobot, Better Stack)
- [ ] Configure backups for PostgreSQL

---

## Quick Commands

```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test backend is running
curl https://your-backend-url.com/health

# View logs on Railway
railway logs
```
