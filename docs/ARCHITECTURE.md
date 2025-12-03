# 🏗️ Architecture Documentation

## System Overview

The Hospital Information System (HIS) is built as a modern, scalable web application following industry best practices and clean architecture principles.

---

## Technology Stack

### Backend

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5.x
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, bcrypt
- **Logging**: Winston

### Frontend

- **Framework**: React 18
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS 3
- **State Management**: Zustand
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod
- **Animations**: Framer Motion
- **HTTP Client**: Axios
- **UI Components**: Custom components + shadcn/ui patterns
- **Notifications**: Sonner

---

## Architectural Patterns

### Backend Architecture

#### Domain-Driven Design (DDD)

The backend follows a modular, domain-driven structure where each domain (patients, visits, consultations, etc.) is isolated into its own module.

#### Layered Architecture

```
┌─────────────────────────────────────┐
│          Routes Layer                │  ← HTTP routing
├─────────────────────────────────────┤
│         Controller Layer             │  ← Request/Response handling
├─────────────────────────────────────┤
│          Service Layer               │  ← Business logic
├─────────────────────────────────────┤
│        Repository Layer              │  ← Data access
├─────────────────────────────────────┤
│         Database (Prisma)            │  ← ORM
└─────────────────────────────────────┘
```

**Responsibilities:**

1. **Routes** (`routes.js`)

   - Define HTTP endpoints
   - Apply middleware (auth, validation)
   - Map to controller methods

2. **Controllers** (`controller.js`)

   - Handle HTTP requests
   - Extract data from request
   - Call service methods
   - Format responses
   - **NO business logic**

3. **Services** (`service.js`)

   - Contain all business logic
   - Data validation
   - Authorization checks
   - Orchestrate repository calls
   - Error handling

4. **Repositories** (`repository.js`)

   - All database queries
   - Data transformation
   - Transaction management
   - **NO business logic**

5. **Schemas** (`schema.js`)
   - Zod validation schemas
   - Input validation rules
   - Type definitions

#### Module Structure Example

```javascript
/src/modules/patients/
├── controller.js      // HTTP handlers
├── service.js         // Business logic
├── repository.js      // Database queries
├── routes.js          // Route definitions
└── schema.js          // Validation schemas
```

---

### Frontend Architecture

#### Feature-Based Structure

```
/src
├── pages/              # Route-level components
├── features/           # Feature modules
│   ├── patients/
│   │   ├── api/       # API calls
│   │   ├── components/ # Feature-specific components
│   │   ├── hooks/     # Custom hooks
│   │   └── types/     # TypeScript types (if used)
├── components/         # Shared components
│   ├── ui/            # Reusable UI components
│   └── layout/        # Layout components
├── store/             # Zustand stores
├── lib/               # Utilities
└── styles/            # Global styles
```

#### Component Hierarchy

```
App
├── Routes
│   ├── AuthLayout
│   │   └── LoginPage
│   └── MainLayout
│       ├── Sidebar
│       ├── Header
│       └── Pages
│           ├── DashboardPage
│           ├── PatientRegistrationPage
│           ├── ConsultationPage
│           └── ...
```

---

## Data Flow

### Backend Request Flow

```
Client Request
    ↓
[CORS Middleware]
    ↓
[Helmet Security]
    ↓
[Request Logger]
    ↓
[Rate Limiter]
    ↓
[Route Handler]
    ↓
[Authentication Middleware] ← Verify JWT
    ↓
[Authorization Middleware] ← Check role
    ↓
[Validation Middleware] ← Validate with Zod
    ↓
[Controller]
    ↓
[Service] ← Business logic
    ↓
[Repository] ← Database query
    ↓
[Prisma] ← ORM
    ↓
[PostgreSQL]
    ↓
Response ← Format & send
```

### Frontend State Flow

```
User Action
    ↓
[Component Event Handler]
    ↓
[Zustand Store Action]
    ↓
[API Call (Axios)]
    ↓
[Backend API]
    ↓
[Response]
    ↓
[Update Zustand State]
    ↓
[React Re-render]
    ↓
[UI Update with Animation]
```

---

## Database Design

### Schema Principles

1. **Normalization**: 3NF for most tables
2. **Soft Deletes**: `deletedAt` timestamp
3. **Audit Trail**: Comprehensive logging
4. **Relationships**: Proper foreign keys with cascades
5. **Indexes**: On frequently queried fields
6. **Constraints**: Data integrity at DB level

### Key Relationships

```
Patient (1) ──< (Many) Visit
Visit (1) ──< (Many) Vital
Visit (1) ──< (Many) Consultation
Consultation (1) ──< (Many) Diagnosis
Consultation (1) ──< (Many) Prescription
Prescription (1) ──< (Many) PrescriptionItem
PrescriptionItem (Many) >── (1) Drug
Consultation (1) ──< (Many) LabOrder
LabOrder (1) ──< (Many) LabOrderItem
LabOrder (1) ──< (Many) LabResult
Patient (1) ──< (Many) Bill
Bill (1) ──< (Many) BillItem
Bill (1) ──< (Many) Payment
```

### Indexing Strategy

**Indexes are created on:**

- Primary keys (automatic)
- Foreign keys
- Frequently searched fields (email, username, phone, patientNumber)
- Status fields for filtering
- Date fields for sorting
- Soft delete columns (`deletedAt`)

---

## Security Architecture

### Authentication Flow

```
1. User Login
   ├─ Username + Password
   ↓
2. Backend Validation
   ├─ Check credentials
   ├─ Hash comparison (bcrypt)
   ↓
3. Token Generation
   ├─ Access Token (15 min expiry)
   ├─ Refresh Token (7 days expiry)
   ↓
4. Store Tokens
   ├─ Backend: Refresh token in DB
   ├─ Frontend: Both tokens in localStorage
   ↓
5. Subsequent Requests
   ├─ Access Token in Authorization header
   ↓
6. Token Expiry
   ├─ Access Token expires
   ├─ Auto-refresh using Refresh Token
   ↓
7. Logout
   ├─ Invalidate tokens
   └─ Clear from storage
```

### Authorization Levels

**Role-Based Access Control (RBAC)**

| Role          | Access                                   |
| ------------- | ---------------------------------------- |
| ADMIN         | Full system access                       |
| FRONT_DESK    | Patient registration, visit creation     |
| NURSE         | Triage, vitals recording                 |
| DOCTOR        | Consultations, prescriptions, lab orders |
| PHARMACIST    | Prescription viewing, dispensing         |
| LAB_TECH      | Lab orders, result entry                 |
| BILLING_CLERK | Billing, payments, receipts              |

### Security Measures

1. **Password Security**

   - Bcrypt hashing (12 rounds)
   - Minimum 8 characters
   - Must include: uppercase, lowercase, number

2. **Token Security**

   - Short-lived access tokens (15 min)
   - Refresh token rotation
   - Stored securely (httpOnly cookies recommended in production)

3. **Input Validation**

   - Zod schemas on all inputs
   - SQL injection prevention (Prisma parameterization)
   - XSS prevention (sanitization)

4. **Rate Limiting**

   - 100 requests per 15 minutes per IP
   - Stricter limits on auth endpoints

5. **HTTPS Enforcement**

   - All production traffic over HTTPS
   - HSTS headers

6. **CORS Configuration**
   - Whitelist allowed origins
   - Credentials support

---

## State Management

### Zustand Stores

#### Auth Store

```javascript
{
  user: { id, email, firstName, lastName, role },
  accessToken: "jwt-token",
  refreshToken: "refresh-token",
  isAuthenticated: boolean,
  login: async (credentials) => {},
  logout: async () => {},
  refreshAccessToken: async () => {}
}
```

#### Patient Store

```javascript
{
  patients: [],
  currentPatient: {},
  searchResults: [],
  pagination: { page, limit, total, pages },
  searchPatients: async (term) => {},
  createPatient: async (data) => {},
  getPatientById: async (id) => {},
  updatePatient: async (id, data) => {}
}
```

**Why Zustand?**

- Minimal boilerplate
- No providers needed
- TypeScript-friendly
- Small bundle size (1kb)
- Easy to test
- Can use outside React components

---

## API Design Principles

### RESTful Conventions

```
GET    /api/patients           # List all
GET    /api/patients/:id       # Get one
POST   /api/patients           # Create
PATCH  /api/patients/:id       # Update
DELETE /api/patients/:id       # Delete
GET    /api/patients/search    # Search
```

### Response Format

**Success Response:**

```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Pagination

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

---

## Scalability Considerations

### Current Architecture

- Monolithic backend (Express)
- Single database instance
- Suitable for: 1-5 hospitals, up to 50k patients

### Future Scaling Path

#### Phase 1: Vertical Scaling

- Increase server resources
- Database connection pooling
- Redis caching layer
- CDN for static assets

#### Phase 2: Horizontal Scaling

- Load balancer (Nginx)
- Multiple backend instances
- Session store (Redis)
- Database read replicas

#### Phase 3: Microservices

- Split domains into services:
  - Patient Service
  - Visit Service
  - Billing Service
  - Lab Service
- API Gateway
- Message queue (RabbitMQ/Kafka)

#### Phase 4: Cloud Native

- Kubernetes orchestration
- Auto-scaling
- Multi-region deployment
- Managed database (AWS RDS, Azure SQL)

---

## Performance Optimizations

### Backend

- **Database Indexing**: On all searchable fields
- **Query Optimization**: Use Prisma's `include` selectively
- **Connection Pooling**: Prisma default
- **Pagination**: All list endpoints
- **Caching**: Future Redis implementation

### Frontend

- **Code Splitting**: React.lazy for routes
- **Image Optimization**: WebP format, lazy loading
- **Bundle Size**: Tree-shaking, minimal dependencies
- **API Caching**: React Query consideration for future
- **Memoization**: useMemo, useCallback for expensive operations

---

## Testing Strategy

### Backend Testing

```
Unit Tests (Jest)
├── Services: Business logic
├── Repositories: Database queries
└── Utils: Helper functions

Integration Tests (Supertest)
├── API Endpoints
└── Database transactions

E2E Tests (future)
└── Critical user flows
```

### Frontend Testing

```
Unit Tests (Vitest)
├── Components
├── Hooks
└── Utils

Integration Tests (React Testing Library)
└── User interactions

E2E Tests (Playwright)
└── Complete user journeys
```

---

## Deployment Architecture

### Development

```
localhost:5173 (Vite Dev Server)
    ↓
localhost:5000 (Express API)
    ↓
localhost:5432 (PostgreSQL)
```

### Production

```
                    [Users]
                       ↓
              [Load Balancer]
                       ↓
        ┌──────────────┴──────────────┐
        ↓                              ↓
   [Web Server 1]              [Web Server 2]
   (Frontend + API)            (Frontend + API)
        ↓                              ↓
        └──────────────┬──────────────┘
                       ↓
              [Database Cluster]
            (Primary + Replicas)
```

---

## Monitoring & Logging

### Application Logging (Winston)

- Error logs → `logs/error.log`
- Combined logs → `logs/combined.log`
- Console output in development

### Audit Logging

- All critical actions logged to `audit_logs` table
- Includes: user, action, timestamp, IP, changes

### Future Monitoring

- Application Performance Monitoring (APM)
- Error tracking (Sentry)
- Analytics dashboard
- Uptime monitoring

---

## Development Workflow

### Git Workflow

```
main (production)
  ↑
develop (staging)
  ↑
feature/* (new features)
hotfix/* (urgent fixes)
```

### CI/CD Pipeline (Future)

```
1. Push to GitHub
   ↓
2. Run Tests
   ↓
3. Lint Code
   ↓
4. Build Application
   ↓
5. Deploy to Staging
   ↓
6. Integration Tests
   ↓
7. Manual Approval
   ↓
8. Deploy to Production
```

---

## Design System

### Color Tokens

```javascript
primary: {
  50: '#E6F2FF',
  500: '#0066CC', // Main
  700: '#003D7A'
}

secondary: {
  50: '#E6F9F5',
  500: '#00AA88', // Main
  700: '#006652'
}
```

### Spacing Scale

- Based on 8px unit
- 0.5, 1, 1.5, 2, 3, 4, 6, 8rem

### Typography

- Font: Inter
- Sizes: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Component Library

- Button (5 variants)
- Input, Select, Textarea
- Card
- Modal
- Badge
- Avatar
- Spinner, Skeleton
- All with Framer Motion animations

---

## Conclusion

This architecture provides:

- ✅ Scalability from startup to enterprise
- ✅ Maintainability through clean separation
- ✅ Security through multiple layers
- ✅ Performance through optimization
- ✅ Developer experience through modern tools
- ✅ User experience through thoughtful design

The system is built to evolve with the hospital's needs while maintaining code quality and performance.
