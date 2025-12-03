# 🚀 Quick Setup Guide

## Prerequisites

Before starting, ensure you have:

- **Node.js**: Version 18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL**: Version 15 or higher ([Download](https://www.postgresql.org/download/))
- **npm**: Version 9 or higher (comes with Node.js)
- **Git**: For version control ([Download](https://git-scm.com/))

---

## Step-by-Step Setup

### 1. Clone & Install Dependencies

```bash
# Navigate to project root
cd HMS

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

#### Create Database

```bash
# Open PostgreSQL terminal
psql -U postgres

# Create database
CREATE DATABASE his_db;

# Exit psql
\q
```

#### Configure Environment

```bash
# In backend folder
cd backend
cp .env.example .env
```

Edit `.env` file:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/his_db?schema=public"
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
```

#### Run Migrations

**What are migrations?**  
Migrations are version-controlled database schema changes. They create and update your database tables, columns, indexes, and relationships based on your `schema.prisma` file.

```bash
# Step 1: Generate Prisma Client
npx prisma generate
```

**What this does:**

- Reads your `schema.prisma` file
- Generates type-safe TypeScript/JavaScript client code
- Creates models with autocomplete for all your database tables
- Must be run after any schema changes

```bash
# Step 2: Run database migrations
npx prisma migrate dev
```

**What this does:**

- Compares your schema with the current database
- Creates a new migration file with SQL statements
- Applies the migration to your database
- Automatically runs `prisma generate` afterward
- Prompts you to name the migration (e.g., "init", "add-patients-table")

**Example output:**

```
✔ Enter a name for the new migration: … init
Applying migration `20241117120000_init`
✅ Your database is now in sync with your schema.
```

```bash
# Step 3: Seed database with sample data (optional but recommended)
npx prisma db seed
```

**What this does:**

- Runs the seed script at `prisma/seed.js`
- Populates your database with initial data:
  - ✅ 7 user roles (ADMIN, DOCTOR, NURSE, etc.)
  - ✅ 7 test users (one for each role)
  - ✅ 20 sample patients with realistic Ghanaian names
  - ✅ 5 sample visits
  - ✅ 5 common lab tests (CBC, Malaria, Blood Glucose, etc.)
  - ✅ 5 common drugs (Paracetamol, Amoxicillin, Coartem, etc.)
- All test users have password: `Admin123!`

**Test users created:**
| Username | Role | Email |
|-------------|----------------|------------------------|
| admin | ADMIN | admin@hospital.com |
| frontdesk | FRONT_DESK | frontdesk@hospital.com |
| nurse | NURSE | nurse@hospital.com |
| doctor | DOCTOR | doctor@hospital.com |
| pharmacist | PHARMACIST | pharmacist@hospital.com|
| labtech | LAB_TECH | labtech@hospital.com |
| billing | BILLING_CLERK | billing@hospital.com |

**💡 Pro Tips:**

- If you modify `schema.prisma`, run `npx prisma migrate dev` again
- To reset database: `npx prisma migrate reset` (⚠️ deletes all data!)
- To view data: `npx prisma studio` (opens GUI at http://localhost:5555)
- Migrations are tracked in `prisma/migrations/` folder (commit these to git!)

### 3. Start Development Servers

#### Terminal 1 - Backend

```bash
cd backend
npm run dev

# Server runs on http://localhost:5000
```

#### Terminal 2 - Frontend

```bash
cd frontend
npm run dev

# App runs on http://localhost:5173
```

### 4. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

**Default Login Credentials:**

- Username: `admin`
- Password: `Admin123!`

---

## Database Management

### View Database

```bash
cd backend
npx prisma studio

# Opens GUI at http://localhost:5555
```

### Create Migration

```bash
# After modifying schema.prisma
npx prisma migrate dev --name description_of_change
```

### Reset Database

```bash
# WARNING: This deletes all data!
npx prisma migrate reset
```

---

## Project Structure

```
HMS/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── modules/        # Domain modules
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── visits/
│   │   │   └── ...
│   │   ├── core/           # Core infrastructure
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── prisma/         # Database schema
│   │   └── server.js       # Entry point
│   ├── .env                # Environment variables
│   └── package.json
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── components/    # UI components
│   │   ├── store/         # Zustand stores
│   │   ├── lib/           # Utilities
│   │   └── styles/        # Global styles
│   └── package.json
│
└── docs/                  # Documentation
    ├── API.md
    ├── FLOWS.md
    └── ARCHITECTURE.md
```

---

## NPM Scripts

### Backend

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma Client
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed database with sample data
npm test             # Run tests
```

### Frontend

```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Lint code
```

---

## Common Issues & Solutions

### Issue: Port already in use

```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

### Issue: Database connection error

- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists
- Check credentials

### Issue: Module not found

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Prisma Client not generated

```bash
cd backend
npx prisma generate
```

---

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:5000/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# Create patient (with token)
curl -X POST http://localhost:5000/api/patients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "gender": "MALE",
    "phoneNumber": "+233244123456"
  }'
```

### Using Postman

1. Import API collection (future: create collection)
2. Set environment variable: `baseUrl = http://localhost:5000/api`
3. Test all endpoints

---

## Development Workflow

### Creating a New Feature

1. **Backend Module**

```bash
cd backend/src/modules
mkdir feature-name
cd feature-name
touch controller.js service.js repository.js routes.js schema.js
```

2. **Frontend Page**

```bash
cd frontend/src/pages
mkdir feature-name
touch feature-name/FeaturePage.jsx
```

3. **Add Route**
   Edit `frontend/src/App.jsx`:

```jsx
<Route path="/feature" element={<FeaturePage />} />
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: add feature description"

# Push to remote
git push origin feature/feature-name

# Create pull request on GitHub
```

---

## Production Deployment

### Build Frontend

```bash
cd frontend
npm run build

# Dist folder created with optimized build
```

### Environment Variables (Production)

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@production-host:5432/db
JWT_SECRET=strong-random-secret
CORS_ORIGIN=https://yourdomain.com
```

### Using Docker (Optional)

**Backend Dockerfile:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["node", "src/server.js"]
```

**Frontend Dockerfile:**

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Docker Compose:**

```yaml
version: "3.8"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: his_db
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## Support & Resources

### Documentation

- [API Documentation](./docs/API.md)
- [User Flows](./docs/FLOWS.md)
- [Architecture](./docs/ARCHITECTURE.md)

### Technology Docs

- [Express.js](https://expressjs.com/)
- [Prisma](https://www.prisma.io/docs)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Framer Motion](https://www.framer.com/motion/)

---

## Next Steps

After setup:

1. ✅ Explore the dashboard
2. ✅ Register a test patient
3. ✅ Create a visit
4. ✅ Review the code structure
5. ✅ Read the documentation
6. ✅ Start building features!

---

**Built with excellence. Ready for impact.** 🚀
