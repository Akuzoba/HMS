# 🗄️ Database Migration Guide

Complete guide to understanding and using Prisma migrations in the Hospital Information System.

---

## 📚 Table of Contents

1. [What are Migrations?](#what-are-migrations)
2. [Migration Commands Explained](#migration-commands-explained)
3. [Step-by-Step First Setup](#step-by-step-first-setup)
4. [Seeding Explained](#seeding-explained)
5. [Common Scenarios](#common-scenarios)
6. [Troubleshooting](#troubleshooting)

---

## What are Migrations?

**Migrations** are version-controlled database schema changes that allow you to:

- ✅ Create and modify database tables
- ✅ Track schema changes over time
- ✅ Share database structure with team members
- ✅ Roll back changes if needed
- ✅ Keep development and production databases in sync

Think of migrations like **Git for your database schema**.

### Migration Files

Located in: `backend/prisma/migrations/`

Each migration has:

- **Timestamp**: When it was created (e.g., `20241117120000`)
- **Name**: Description (e.g., `init`, `add_patients_table`)
- **SQL file**: The actual database changes

Example structure:

```
prisma/migrations/
├── 20241117120000_init/
│   └── migration.sql
├── 20241118093000_add_patients_table/
│   └── migration.sql
└── migration_lock.toml
```

---

## Migration Commands Explained

### 1. `npx prisma generate`

**Purpose:** Generates the Prisma Client (type-safe database API)

**When to use:**

- After modifying `schema.prisma`
- After pulling new schema changes from git
- When Prisma Client is missing or outdated

**What it does:**

```bash
npx prisma generate

Reading schema.prisma...
✔ Generated Prisma Client (5.7.0)
```

- Reads your `schema.prisma` file
- Creates `node_modules/@prisma/client` with type-safe models
- Provides autocomplete for your database operations
- Takes 5-10 seconds to complete

**Example usage in code:**

```javascript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Now you have autocomplete for all your models!
const patients = await prisma.patient.findMany();
```

---

### 2. `npx prisma migrate dev`

**Purpose:** Creates and applies migrations in development

**When to use:**

- First time database setup
- After adding/modifying models in `schema.prisma`
- When you need to sync schema with database

**What it does:**

```bash
npx prisma migrate dev

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

✔ Enter a name for the new migration: › init

Applying migration `20241117120000_init`

The following migration(s) have been created and applied:

migrations/
  └─ 20241117120000_init/
    └─ migration.sql

✔ Generated Prisma Client
✅ Your database is now in sync with your schema.
```

**Steps it performs:**

1. Compares `schema.prisma` with current database state
2. Detects differences (new tables, columns, etc.)
3. Generates SQL statements to make the changes
4. Prompts you to name the migration
5. Creates a new migration folder with SQL file
6. Applies the migration to your database
7. Automatically runs `prisma generate`

**Interactive prompt:**

```bash
✔ Enter a name for the new migration: ›
```

Good names: `init`, `add_patients`, `add_billing_module`, `update_user_roles`

---

### 3. `npx prisma migrate deploy`

**Purpose:** Applies migrations in production (non-interactive)

**When to use:**

- Production deployments
- CI/CD pipelines
- Staging environments

**What it does:**

- Applies pending migrations without prompting
- Does NOT create new migrations
- Does NOT reset the database
- Safer for production use

**Example:**

```bash
npx prisma migrate deploy

Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma

5 migrations found in prisma/migrations

Applying migration `20241117120000_init`
Applying migration `20241118093000_add_patients`

✅ All migrations have been successfully applied.
```

---

### 4. `npx prisma db seed`

**Purpose:** Populates database with initial/test data

**When to use:**

- After initial migration
- When you need test data for development
- After resetting the database

**What it does:**
Runs the seed script at `prisma/seed.js` which creates:

**👥 Users & Roles:**

- 7 roles: ADMIN, FRONT_DESK, NURSE, DOCTOR, PHARMACIST, LAB_TECH, BILLING_CLERK
- 7 test users (one per role, password: `Admin123!`)

**🏥 Sample Data:**

- 20 patients with realistic Ghanaian names and addresses
- 5 sample visits (checked-in status)
- 5 common lab tests (CBC, Malaria RDT, Blood Glucose, etc.)
- 5 common drugs (Paracetamol, Amoxicillin, Coartem, etc.)

**Example output:**

```bash
npx prisma db seed

🌱 Starting database seeding...

🧹 Cleaning existing data...
✅ Cleaned existing data

👥 Creating roles...
✅ Created 7 roles

👤 Creating users...
✅ Created 7 users

🔬 Creating lab tests...
✅ Created 5 lab tests

💊 Creating drugs...
✅ Created 5 drugs

🏥 Creating sample patients...
✅ Created 20 sample patients

📋 Creating sample visits...
✅ Created 5 sample visits

🎉 Database seeding completed!

📊 Summary:
   • 7 roles
   • 7 users
   • 5 lab tests
   • 5 drugs
   • 20 patients
   • 5 visits

👤 Test Users (all passwords: Admin123!):
   • admin (ADMIN)
   • frontdesk (FRONT_DESK)
   • nurse (NURSE)
   • doctor (DOCTOR)
   • pharmacist (PHARMACIST)
   • labtech (LAB_TECH)
   • billing (BILLING_CLERK)

✅ You can now login with any of these users!
```

---

### 5. `npx prisma migrate reset`

**Purpose:** Resets database to a clean state

⚠️ **WARNING:** This **DELETES ALL DATA**!

**What it does:**

1. Drops all tables
2. Recreates database from scratch
3. Applies all migrations in order
4. Runs seed script (if configured)

**When to use:**

- Development only (NEVER in production!)
- When migrations are broken
- When you want to start fresh
- During testing

**Example:**

```bash
npx prisma migrate reset

⚠️  This will reset your database. All data will be lost.
✔ Are you sure? › yes

Dropping existing database...
Creating new database...
Applying 5 migrations...

✅ Database reset successful.
Running seed script...
✅ Seeding complete.
```

---

### 6. `npx prisma studio`

**Purpose:** Opens visual database browser

**What it does:**

- Launches GUI at `http://localhost:5555`
- View all tables and data
- Edit records manually
- Filter and search data
- Great for debugging

**Example:**

```bash
npx prisma studio

Prisma Studio is up on http://localhost:5555
```

Then open your browser to see all your data in a nice interface!

---

## Step-by-Step First Setup

Complete walkthrough for setting up the database for the first time:

### Prerequisites

```bash
# 1. PostgreSQL must be running
# Windows: Check Services → PostgreSQL
# Mac: brew services list
# Linux: sudo systemctl status postgresql

# 2. Database must exist
psql -U postgres
CREATE DATABASE his_db;
\q
```

### Setup Steps

```bash
# Step 1: Navigate to backend folder
cd backend

# Step 2: Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Step 3: Install dependencies (if not already done)
npm install

# Step 4: Generate Prisma Client
npx prisma generate
# ✅ This creates the type-safe database client

# Step 5: Run initial migration
npx prisma migrate dev --name init
# ✅ This creates all database tables

# Step 6: Seed the database
npx prisma db seed
# ✅ This adds test users and sample data

# Step 7: Verify with Prisma Studio
npx prisma studio
# ✅ Opens GUI to view your data

# Step 8: Start the server
npm run dev
# ✅ Backend runs on http://localhost:5000
```

**You're done!** 🎉 You can now:

- Login at http://localhost:5173
- Use username: `admin`, password: `Admin123!`
- See 20 sample patients already in the system

---

## Seeding Explained

The seed script (`prisma/seed.js`) is a JavaScript file that runs after migrations to populate your database.

### What Gets Seeded?

#### 1. Roles (7 total)

```javascript
ADMIN          → Full system access
FRONT_DESK     → Patient registration, visits
NURSE          → Triage, vitals recording
DOCTOR         → Consultations, prescriptions, lab orders
PHARMACIST     → View and dispense prescriptions
LAB_TECH       → Lab orders, enter results
BILLING_CLERK  → Create bills, process payments
```

#### 2. Test Users (7 total)

All with password: `Admin123!`

| Username   | Email                   | Role          |
| ---------- | ----------------------- | ------------- |
| admin      | admin@hospital.com      | ADMIN         |
| frontdesk  | frontdesk@hospital.com  | FRONT_DESK    |
| nurse      | nurse@hospital.com      | NURSE         |
| doctor     | doctor@hospital.com     | DOCTOR        |
| pharmacist | pharmacist@hospital.com | PHARMACIST    |
| labtech    | labtech@hospital.com    | LAB_TECH      |
| billing    | billing@hospital.com    | BILLING_CLERK |

#### 3. Sample Patients (20 total)

Realistic Ghanaian names and data:

- Kwame Mensah, Akosua Boateng, Abena Osei, etc.
- Ages: 1-80 years
- Blood groups: A+, O+, B+, etc.
- Phone numbers: +233 format
- Addresses: Accra, Kumasi, Takoradi, etc.

#### 4. Lab Tests (5 common)

```javascript
CBC              → Complete Blood Count (₵50.00)
FBS              → Fasting Blood Sugar (₵20.00)
MAL-RDT          → Malaria Rapid Test (₵15.00)
LIPID            → Lipid Profile (₵80.00)
URINE            → Urinalysis (₵25.00)
```

#### 5. Drugs (5 common)

```javascript
Paracetamol      → 500mg tablets (₵0.50 each)
Amoxicillin      → 500mg capsules (₵1.50 each)
Coartem          → Anti-malaria (₵8.00 per pack)
Metformin        → Diabetes med (₵0.80 each)
Omeprazole       → Ulcer med (₵1.20 each)
```

#### 6. Sample Visits (5 active)

- First 5 patients have active visits
- Status: CHECKED_IN
- Chief complaints: Fever, abdominal pain, cough, etc.

### Customizing the Seed

Edit `prisma/seed.js` to add your own data:

```javascript
// Add more patients
for (let i = 0; i < 50; i++) {
  // Change to 50
  // ... patient creation
}

// Add more drugs
await prisma.drug.create({
  data: {
    name: "Ibuprofen",
    strength: "400mg",
    price: 0.8,
    // ...
  },
});
```

Then run: `npx prisma db seed`

---

## Common Scenarios

### Scenario 1: Adding a New Table

**You want to add a new `Appointment` model:**

1. **Edit `schema.prisma`:**

```prisma
model Appointment {
  id        String   @id @default(uuid())
  patientId String
  doctorId  String
  dateTime  DateTime
  status    String
  notes     String?
  createdAt DateTime @default(now())

  patient   Patient @relation(fields: [patientId], references: [id])
  doctor    User    @relation(fields: [doctorId], references: [id])

  @@map("appointments")
}
```

2. **Create migration:**

```bash
npx prisma migrate dev --name add_appointments_table
```

3. **Done!** The table is now created and Prisma Client updated.

---

### Scenario 2: Modifying an Existing Table

**You want to add `middleName` to patients:**

1. **Edit `schema.prisma`:**

```prisma
model Patient {
  id         String @id @default(uuid())
  firstName  String
  middleName String? // ← Add this
  lastName   String
  // ... rest of fields
}
```

2. **Create migration:**

```bash
npx prisma migrate dev --name add_middle_name_to_patients
```

3. **Prisma asks what to do with existing records:**

```
⚠ We found changes in your schema that require a migration:

• Added required column `middleName` to table `patients`

✔ Do you want to set a default value? › yes
✔ Enter default value: › ""  (empty string is fine since it's optional)
```

---

### Scenario 3: Fresh Start

**You messed up and want to start over:**

```bash
# Option 1: Reset everything
npx prisma migrate reset
# ⚠️ Deletes all data and reapplies all migrations

# Option 2: Delete database and start fresh
psql -U postgres
DROP DATABASE his_db;
CREATE DATABASE his_db;
\q

# Then run migrations again
npx prisma migrate dev --name init
npx prisma db seed
```

---

### Scenario 4: Pulling Changes from Git

**A teammate added migrations:**

```bash
# 1. Pull the latest code
git pull origin main

# 2. Install any new dependencies
npm install

# 3. Apply new migrations
npx prisma migrate dev

# 4. Regenerate Prisma Client
npx prisma generate

# Done! Your database is now in sync.
```

---

## Troubleshooting

### Error: "P1001: Can't reach database server"

**Cause:** PostgreSQL is not running or wrong credentials

**Solution:**

```bash
# Check if PostgreSQL is running
# Windows: Services → PostgreSQL
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Verify connection
psql -U postgres -h localhost

# Check .env DATABASE_URL is correct
```

---

### Error: "P3018: Migration failed to apply"

**Cause:** Database state conflicts with migration

**Solution:**

```bash
# View current migrations
npx prisma migrate status

# Option 1: Resolve manually
npx prisma migrate resolve --applied <migration_name>

# Option 2: Reset (⚠️ deletes data)
npx prisma migrate reset
```

---

### Error: "Prisma Client not found"

**Cause:** Forgot to run `prisma generate`

**Solution:**

```bash
npx prisma generate
```

---

### Error: Seed script fails

**Cause:** Missing dependencies or data conflicts

**Solution:**

```bash
# Install missing dependency
npm install @faker-js/faker bcrypt

# Check seed script for errors
node prisma/seed.js

# Reset and try again
npx prisma migrate reset
```

---

### Migration Naming Best Practices

✅ **Good names:**

- `init` - Initial setup
- `add_patients_table` - Clear what was added
- `update_user_roles` - Clear what changed
- `add_billing_module` - Feature-based

❌ **Bad names:**

- `migration1` - Not descriptive
- `update` - Too vague
- `fix` - Doesn't explain what was fixed
- `asdf` - Random

---

## Quick Reference

### One-Time Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### After Schema Changes

```bash
npx prisma migrate dev --name describe_your_change
```

### View Data

```bash
npx prisma studio
```

### Reset Everything (⚠️ Deletes data!)

```bash
npx prisma migrate reset
```

### Production Deploy

```bash
npx prisma migrate deploy
```

---

## Summary

| Command                 | Purpose                  | When to Use            |
| ----------------------- | ------------------------ | ---------------------- |
| `prisma generate`       | Create Prisma Client     | After schema changes   |
| `prisma migrate dev`    | Create & apply migration | After modifying schema |
| `prisma migrate deploy` | Apply migrations (prod)  | Production deployments |
| `prisma db seed`        | Add test data            | Development setup      |
| `prisma migrate reset`  | Reset database           | Fresh start (dev only) |
| `prisma studio`         | Visual DB browser        | View/edit data         |

---

**Need help?** Check the [Prisma Documentation](https://www.prisma.io/docs) or open an issue!

---

_Last Updated: January 17, 2025_
