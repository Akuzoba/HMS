# 🏥 Hospital Information System (HIS)

> **An elegant, scalable, production-ready hospital management system built for excellence.**

## 🎯 Philosophy

Every pixel intentional. Every abstraction elegant. Every module built to serve all hospitals in Ghana.

## 🛠️ Technology Stack

### Frontend

- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand (chosen for simplicity, less boilerplate, better DX than Redux)
- **Animations**: Framer Motion
- **Validation**: Zod
- **HTTP Client**: Axios with interceptors

### Backend

- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma (chosen for type-safety, migrations, better DX than Sequelize)
- **Authentication**: JWT with refresh tokens
- **Validation**: Zod
- **Security**: Helmet, CORS, Rate Limiting

### Why Prisma over Sequelize?

- **Type Safety**: Auto-generated TypeScript types
- **Modern DX**: Intuitive query API, better IDE support
- **Migrations**: Declarative schema with automatic migrations
- **Performance**: Query optimization and connection pooling built-in
- **Maintainability**: Schema as single source of truth

### Why Zustand over Redux Toolkit?

- **Simplicity**: Less boilerplate, easier learning curve
- **Performance**: Optimized re-renders by default
- **DX**: No providers needed, hooks-based API
- **Size**: Smaller bundle (1kb vs 12kb+)
- **Perfect for MVP**: Scales well, but doesn't over-engineer early

## 📁 Project Structure

```
HMS/
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── modules/        # Domain-driven modules
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── visits/
│   │   │   ├── vitals/
│   │   │   ├── consultations/
│   │   │   ├── labs/
│   │   │   ├── prescriptions/
│   │   │   ├── pharmacy/
│   │   │   └── billing/
│   │   ├── core/           # Shared infrastructure
│   │   │   ├── config/
│   │   │   ├── database/
│   │   │   ├── middleware/
│   │   │   └── utils/
│   │   ├── prisma/         # Database schema
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── pages/         # Route pages
│   │   ├── features/      # Feature modules
│   │   ├── components/    # Shared components
│   │   ├── layouts/       # Layout components
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

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Configure DATABASE_URL in .env
npx prisma migrate dev
npx prisma generate
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🎨 Design System

### Color Palette

- **Primary**: Medical Blue (#0066CC)
- **Secondary**: Healing Green (#00AA88)
- **Neutral**: Slate grays
- **Semantic**: Success, Warning, Error, Info

### Typography

- **Headings**: Inter (700, 600, 500)
- **Body**: Inter (400)
- **Mono**: JetBrains Mono

### Spacing Scale

8px base unit (0.5rem, 1rem, 1.5rem, 2rem, 3rem, 4rem, 6rem)

## 🔐 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt (12 rounds)
- Rate limiting on authentication endpoints
- Input validation with Zod
- SQL injection protection via Prisma
- CORS configuration
- Helmet.js security headers
- Row-level access control
- Audit logging

## 📊 Key Features

### Front Desk

- Instant patient search with typeahead
- Quick registration with validation
- Visit creation and check-in

### Triage

- Vital signs capture
- Priority assessment
- Queue management

### Doctor Console

- Split-screen patient view
- Medical history timeline
- Digital prescriptions
- Lab order management
- Clinical notes with templates

### Pharmacy

- Prescription queue
- Dispensing workflow
- Stock management
- Drug interaction warnings

### Laboratory

- Test order management
- Result entry with validation
- Report generation
- Critical value alerts

### Billing

- Auto-invoice generation
- Multiple payment methods
- Receipt printing
- Insurance claims

## 👥 User Roles

- **Admin**: Full system access
- **Front Desk**: Registration, check-in
- **Nurse**: Triage, vitals
- **Doctor**: Consultation, prescriptions, orders
- **Pharmacist**: Dispensing, stock
- **Lab Technician**: Tests, results
- **Billing Clerk**: Invoicing, payments

## 📈 Scalability Considerations

- Pagination on all list endpoints
- Database indexing on search fields
- Soft deletes with audit trail
- Connection pooling
- Caching strategy ready
- Horizontal scaling compatible
- Microservices-ready architecture

## 🧪 Testing Strategy

- Unit tests for services
- Integration tests for APIs
- E2E tests for critical flows
- Load testing for performance

## 📝 License

Proprietary - All Rights Reserved

## 🤝 Contributing

Internal team only. Follow contribution guidelines in CONTRIBUTING.md

---

**Built with excellence. Designed for impact.**
