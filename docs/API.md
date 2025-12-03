# 🔌 API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints except login and registration require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "doctor@hospital.com",
  "username": "drdoe",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+233244123456",
  "roleId": "uuid-of-role"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@hospital.com",
      "username": "drdoe",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "name": "DOCTOR"
      }
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "username": "drdoe",
  "password": "SecurePass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "doctor@hospital.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": {
        "name": "DOCTOR"
      }
    },
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Request Body:**

```json
{
  "refreshToken": "your-refresh-token"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "new-jwt-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### Logout

```http
POST /api/auth/logout
Auth: Required
```

**Response (200):**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 👥 Patient Endpoints

### Create Patient

```http
POST /api/patients
Auth: Required (FRONT_DESK, ADMIN)
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "middleName": "Marie",
  "lastName": "Smith",
  "dateOfBirth": "1990-05-15T00:00:00.000Z",
  "gender": "FEMALE",
  "phoneNumber": "+233244987654",
  "email": "jane.smith@email.com",
  "address": "123 Main Street",
  "city": "Accra",
  "region": "Greater Accra",
  "emergencyContact": "John Smith",
  "emergencyPhone": "+233244111222",
  "bloodGroup": "O+",
  "allergies": "Penicillin",
  "chronicConditions": "Hypertension",
  "insuranceProvider": "NHIS",
  "insuranceNumber": "NHIS-2024-12345"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientNumber": "PT-20250117-0001",
    "firstName": "Jane",
    "lastName": "Smith",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "FEMALE",
    "phoneNumber": "+233244987654",
    "createdAt": "2025-01-17T10:30:00.000Z"
  }
}
```

### Search Patients

```http
GET /api/patients/search?q=jane&page=1&limit=20
Auth: Required
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "patients": [
      {
        "id": "uuid",
        "patientNumber": "PT-20250117-0001",
        "firstName": "Jane",
        "lastName": "Smith",
        "phoneNumber": "+233244987654"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Get Patient by ID

```http
GET /api/patients/:id
Auth: Required
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientNumber": "PT-20250117-0001",
    "firstName": "Jane",
    "lastName": "Smith",
    "dateOfBirth": "1990-05-15T00:00:00.000Z",
    "gender": "FEMALE",
    "phoneNumber": "+233244987654",
    "allergies": "Penicillin",
    "visits": [
      {
        "id": "visit-uuid",
        "visitNumber": "VS-20250117-0001",
        "visitDate": "2025-01-17T10:00:00.000Z",
        "status": "COMPLETED"
      }
    ]
  }
}
```

### Update Patient

```http
PATCH /api/patients/:id
Auth: Required (FRONT_DESK, ADMIN)
```

**Request Body:**

```json
{
  "phoneNumber": "+233244999888",
  "address": "456 New Street"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientNumber": "PT-20250117-0001",
    "phoneNumber": "+233244999888",
    "address": "456 New Street"
  }
}
```

---

## 🏥 Visit Endpoints

### Create Visit

```http
POST /api/visits
Auth: Required (FRONT_DESK, NURSE, ADMIN)
```

**Request Body:**

```json
{
  "patientId": "patient-uuid",
  "visitType": "OPD",
  "chiefComplaint": "Fever and headache for 3 days"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "visit-uuid",
    "visitNumber": "VS-20250117-0001",
    "patientId": "patient-uuid",
    "visitType": "OPD",
    "status": "CHECKED_IN",
    "visitDate": "2025-01-17T10:00:00.000Z"
  }
}
```

---

## 📊 Vitals Endpoints

### Record Vitals

```http
POST /api/vitals
Auth: Required (NURSE, ADMIN)
```

**Request Body:**

```json
{
  "visitId": "visit-uuid",
  "temperature": 38.5,
  "bloodPressureSys": 120,
  "bloodPressureDia": 80,
  "pulseRate": 72,
  "respiratoryRate": 18,
  "oxygenSaturation": 98,
  "weight": 70.5,
  "height": 170,
  "notes": "Patient stable"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "vital-uuid",
    "visitId": "visit-uuid",
    "temperature": 38.5,
    "bloodPressureSys": 120,
    "bloodPressureDia": 80,
    "bmi": 24.4,
    "recordedAt": "2025-01-17T10:15:00.000Z"
  }
}
```

---

## 🩺 Consultation Endpoints

### Create Consultation

```http
POST /api/consultations
Auth: Required (DOCTOR, ADMIN)
```

**Request Body:**

```json
{
  "visitId": "visit-uuid",
  "patientId": "patient-uuid",
  "presentingComplaint": "Fever and headache",
  "historyOfComplaint": "Started 3 days ago",
  "examination": "Temperature elevated, throat examination normal",
  "provisionalDiagnosis": "Viral fever"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "consultation-uuid",
    "visitId": "visit-uuid",
    "patientId": "patient-uuid",
    "doctorId": "doctor-uuid",
    "presentingComplaint": "Fever and headache",
    "status": "IN_PROGRESS",
    "consultationDate": "2025-01-17T10:30:00.000Z"
  }
}
```

---

## 💊 Prescription Endpoints

### Create Prescription

```http
POST /api/prescriptions
Auth: Required (DOCTOR, ADMIN)
```

**Request Body:**

```json
{
  "consultationId": "consultation-uuid",
  "patientId": "patient-uuid",
  "items": [
    {
      "drugId": "drug-uuid",
      "dosage": "1 tablet",
      "frequency": "3 times daily",
      "duration": "7 days",
      "instructions": "Take after meals",
      "quantity": 21
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "prescription-uuid",
    "prescriptionNumber": "RX-20250117-0001",
    "consultationId": "consultation-uuid",
    "patientId": "patient-uuid",
    "status": "PENDING",
    "prescribedAt": "2025-01-17T10:45:00.000Z",
    "items": [...]
  }
}
```

---

## 🧪 Laboratory Endpoints

### Create Lab Order

```http
POST /api/labs/orders
Auth: Required (DOCTOR, ADMIN)
```

**Request Body:**

```json
{
  "consultationId": "consultation-uuid",
  "patientId": "patient-uuid",
  "priority": "ROUTINE",
  "clinicalNotes": "Check for infection",
  "testIds": ["test-uuid-1", "test-uuid-2"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "lab-order-uuid",
    "orderNumber": "LO-20250117-0001",
    "consultationId": "consultation-uuid",
    "patientId": "patient-uuid",
    "priority": "ROUTINE",
    "status": "PENDING",
    "orderedAt": "2025-01-17T11:00:00.000Z"
  }
}
```

---

## 💰 Billing Endpoints

### Create Bill

```http
POST /api/billing/bills
Auth: Required (BILLING_CLERK, ADMIN)
```

**Request Body:**

```json
{
  "patientId": "patient-uuid",
  "items": [
    {
      "itemType": "CONSULTATION",
      "description": "Doctor consultation",
      "quantity": 1,
      "unitPrice": 50.0
    },
    {
      "itemType": "MEDICATION",
      "description": "Paracetamol 500mg x 21",
      "quantity": 1,
      "unitPrice": 15.0
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "bill-uuid",
    "billNumber": "INV-20250117-0001",
    "patientId": "patient-uuid",
    "totalAmount": 65.0,
    "amountPaid": 0,
    "balance": 65.0,
    "status": "UNPAID",
    "issuedAt": "2025-01-17T12:00:00.000Z"
  }
}
```

---

## ⚠️ Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400) - Invalid input data
- `UNAUTHORIZED` (401) - Missing or invalid token
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `DUPLICATE_ERROR` (400) - Duplicate entry
- `INTERNAL_ERROR` (500) - Server error
