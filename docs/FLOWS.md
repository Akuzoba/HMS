# 🔄 User Flow Documentation

## 1️⃣ New Patient Registration Flow

### Actors

- Front Desk Staff

### Steps

1. **Patient Arrival**

   - Patient walks into the hospital
   - Front desk staff opens HIS application

2. **Search for Existing Record**

   - Staff navigates to "Patient Lookup" page
   - Types patient's name or phone number in search bar
   - System performs real-time typeahead search
   - **Decision Point:**
     - If patient found → Proceed to "Returning Patient Flow"
     - If patient not found → Continue registration

3. **Registration Form**

   - Staff clicks "Register New Patient" button
   - Smooth page transition to registration form
   - Form is divided into collapsible sections:
     - Personal Information (auto-expanded)
     - Contact Information
     - Emergency Contact
     - Medical History
     - Insurance Information

4. **Data Entry with Validation**

   - As staff types, fields are validated in real-time
   - Required fields are marked with red asterisk
   - Error messages appear below invalid fields
   - System prevents submission until all required fields are valid

5. **Avatar Placeholder**

   - System automatically generates initials-based avatar
   - Avatar displays in top-right corner during entry

6. **Submission**

   - Staff clicks "Register Patient" button
   - Button shows loading spinner
   - System:
     - Validates all data with Zod schema
     - Generates unique Patient Number (PT-YYYYMMDD-XXXX)
     - Creates patient record in database
     - Logs action in audit trail

7. **Success Confirmation**
   - Success toast notification appears
   - Smooth transition to Patient Profile page
   - Patient Number is displayed prominently
   - Staff can now create a visit

### UI Features

- **Animations**: Form fields slide in from bottom
- **Auto-save**: Draft saved every 30 seconds (future enhancement)
- **Keyboard Navigation**: Tab through fields efficiently
- **Mobile Responsive**: Works on tablets

---

## 2️⃣ Returning Patient Flow

### Actors

- Front Desk Staff

### Steps

1. **Patient Search**

   - Staff uses search bar in "Patient Lookup" page
   - Types: Name, Patient Number, or Phone
   - Results appear instantly (debounced search)
   - Each result shows:
     - Patient photo/avatar
     - Name
     - Patient Number
     - Last visit date
     - Age

2. **Select Patient**

   - Staff clicks on patient card
   - Smooth transition with scale animation
   - Patient Profile page opens

3. **View Patient History**

   - Split-screen layout:
     - **Left**: Patient demographics, allergies, chronic conditions
     - **Right**: Visit history timeline
   - Staff reviews recent visits
   - Expandable visit cards show:
     - Date & Time
     - Chief Complaint
     - Doctor seen
     - Diagnosis
     - Prescriptions

4. **Create New Visit**

   - Staff clicks "New Visit" button
   - Modal slides up from bottom
   - Form fields:
     - Visit Type (OPD, Emergency, Follow-up)
     - Chief Complaint
   - Staff submits

5. **Visit Creation**

   - System:
     - Generates Visit Number (VS-YYYYMMDD-XXXX)
     - Sets status to "CHECKED_IN"
     - Creates audit log
   - Success toast notification
   - Visit appears at top of timeline

6. **Queue for Triage**
   - Patient added to triage queue
   - Triage staff sees patient in their dashboard
   - Status badge shows "Waiting for Triage"

---

## 3️⃣ Triage Workflow

### Actors

- Nurse

### Steps

1. **View Triage Queue**

   - Nurse navigates to Triage page
   - Dashboard shows:
     - List of patients waiting
     - Each card displays:
       - Patient name & photo
       - Chief complaint
       - Wait time (auto-updating)
       - Priority badge
     - Cards sorted by check-in time

2. **Select Patient**

   - Nurse clicks patient card
   - Card expands with smooth animation
   - Form appears for vital signs

3. **Record Vitals**

   - Nurse enters:
     - Temperature (°C)
     - Blood Pressure (Sys/Dia)
     - Pulse Rate (bpm)
     - Respiratory Rate (breaths/min)
     - Oxygen Saturation (%)
     - Weight (kg)
     - Height (cm)
   - BMI auto-calculated as height & weight entered
   - Real-time validation ensures values are within acceptable ranges
   - Warning appears for abnormal values

4. **Priority Assessment**

   - Based on vitals, system suggests priority:
     - 🔴 URGENT (Critical vitals)
     - 🟡 HIGH (Abnormal vitals)
     - 🟢 ROUTINE (Normal vitals)
   - Nurse can override if needed

5. **Save & Queue**

   - Nurse clicks "Complete Triage"
   - Loading spinner on button
   - System:
     - Saves vitals to database
     - Updates visit status to "IN_TRIAGE"
     - Adds patient to doctor queue
   - Success toast notification
   - Patient card slides out with fade animation
   - Next patient card slides up

6. **Vitals History**
   - For returning patients, collapsible panel shows:
     - Previous vitals in chart format
     - Trend indicators (↑ ↓ →)
     - Helps nurse identify patterns

---

## 4️⃣ Doctor Consultation Workflow

### Actors

- Doctor

### Steps

1. **View Queue**

   - Doctor navigates to Consultation page
   - Queue displays patients sorted by:
     - Priority (Urgent first)
     - Triage completion time
   - Each card shows:
     - Patient info
     - Chief complaint
     - Latest vitals
     - Priority badge

2. **Select Patient**

   - Doctor clicks patient card
   - **Split-screen opens:**

   **LEFT PANEL: Patient Data (Read-only)**

   - Patient demographics
   - Vital signs (with trends)
   - Allergies (highlighted in red)
   - Chronic conditions
   - Collapsible sections:
     - Previous diagnoses
     - Current medications
     - Lab results history
   - Scroll independently

   **RIGHT PANEL: Consultation Form**

   - Presenting Complaint (pre-filled from triage)
   - History of Complaint (textarea)
   - Examination Findings (textarea)
   - Provisional Diagnosis (typeahead with ICD-10)
   - Final Diagnosis (typeahead)
   - Treatment Plan (textarea)
   - Clinical Notes (rich text editor)

3. **Write Prescription**

   - Doctor clicks "Add Prescription" button
   - Modal opens with smooth scale animation
   - **Drug Selection:**
     - Typeahead search for drug
     - Shows: Drug name, strength, form
     - Auto-complete with fuzzy search
   - For each drug:
     - Dosage (e.g., "1 tablet")
     - Frequency dropdown (e.g., "3 times daily")
     - Duration (e.g., "7 days")
     - Instructions (textarea)
     - Quantity auto-calculated
   - Can add multiple drugs
   - Drug interaction warnings appear (future enhancement)

4. **Order Lab Tests**

   - Doctor clicks "Order Labs" button
   - Modal with test categories:
     - Hematology
     - Biochemistry
     - Microbiology
     - Radiology
   - Checkboxes for each test
   - Priority selection (Routine, Urgent, STAT)
   - Clinical notes field
   - Selected tests show estimated turnaround time

5. **Save Consultation**

   - Doctor clicks "Save & Continue"
   - All sections validate
   - System creates:
     - Consultation record
     - Prescription (if any)
     - Lab orders (if any)
   - Multiple toasts:
     - ✅ Consultation saved
     - ✅ Prescription created
     - ✅ Lab order sent
   - Smooth page transition

6. **Complete Consultation**
   - Doctor clicks "Mark Complete"
   - Confirmation modal:
     - "Are you sure? Patient will move to Pharmacy/Lab"
   - On confirm:
     - Visit status → "COMPLETED"
     - Patient appears in:
       - Pharmacy queue (if prescription)
       - Lab queue (if tests ordered)
       - Billing queue
   - Success toast
   - Next patient auto-loads

---

## 5️⃣ Pharmacy Workflow

### Actors

- Pharmacist

### Steps

1. **View Queue**

   - Pharmacist navigates to Pharmacy page
   - Queue shows:
     - Pending prescriptions
     - Priority badges
     - Time since prescription
     - Doctor name
   - Filter options:
     - All / Pending / Dispensed
     - Search by patient name/number

2. **Select Prescription**

   - Pharmacist clicks prescription card
   - Card expands with details:
     - Patient info
     - Doctor name
     - Prescription date
     - **Medication list:**
       - Drug name & strength
       - Dosage & frequency
       - Duration
       - Instructions
       - Quantity to dispense

3. **Check Stock**

   - For each drug, system shows:
     - Current stock level
     - Expiry date warning (if < 3 months)
     - Location in pharmacy
   - If stock low:
     - ⚠️ Warning badge appears
     - Option to mark "Partially Dispensed"

4. **Dispense Medication**

   - Pharmacist marks each item as dispensed
   - Checkbox with smooth animation
   - For each item:
     - Enter batch number
     - Enter expiry date
     - Quantity dispensed
   - System validates:
     - Quantity ≤ prescribed amount
     - Quantity ≤ available stock

5. **Update Stock**

   - As items dispensed:
     - Stock automatically decremented
     - Audit log created
   - If stock reaches reorder level:
     - Alert sent to inventory manager

6. **Print Label**

   - Pharmacist clicks "Print Labels"
   - System generates labels with:
     - Patient name
     - Drug name & strength
     - Dosage & frequency
     - Instructions
     - Doctor name
     - Date
     - Barcode

7. **Complete Dispensing**
   - Pharmacist clicks "Mark Dispensed"
   - Prescription status → "DISPENSED"
   - Timestamp recorded
   - Patient notified (future: SMS)
   - Prescription slides out with animation
   - Next prescription slides in

---

## 6️⃣ Laboratory Workflow

### Actors

- Lab Technician, Pathologist (for verification)

### Steps

1. **View Lab Queue**

   - Lab tech navigates to Lab page
   - Queue shows:
     - Pending orders
     - Priority (STAT highlighted)
     - Order date & time
     - Test types
     - Clinical notes from doctor
   - Filter by:
     - Status
     - Priority
     - Test category

2. **Select Order**

   - Tech clicks order card
   - Order details expand:
     - Patient info
     - Ordering doctor
     - Tests requested
     - Clinical indication
     - Sample requirements

3. **Sample Collection**

   - Tech clicks "Collect Sample"
   - Modal prompts:
     - Sample type collected
     - Collection date/time
     - Barcode scanned
   - Status → "SAMPLE_COLLECTED"

4. **Process Tests**

   - Tech clicks "Enter Results"
   - For each test:
     - Result field (numeric or text)
     - Unit (pre-filled)
     - Normal range displayed
     - Flag field (Normal/High/Low/Critical)
   - As values entered:
     - Auto-flag if outside range
     - Critical values highlighted in red

5. **Attach Files**

   - For radiology/images:
     - Upload button
     - Drag-and-drop area
     - Preview thumbnails
     - Supported: PDF, JPG, PNG

6. **Review & Verify**

   - Tech clicks "Submit for Verification"
   - Pathologist reviews:
     - All results
     - Flags
     - Clinical correlation
   - Can add comments
   - Clicks "Verify & Finalize"

7. **Generate Report**

   - System auto-generates PDF:
     - Hospital letterhead
     - Patient details
     - Test results table
     - Normal ranges
     - Flags highlighted
     - Technician & verifier signatures
     - Date & time
   - Report saved to patient record

8. **Notify Doctor**
   - Status → "COMPLETED"
   - Doctor sees notification
   - Result appears in patient's lab history
   - Critical results trigger immediate alert

---

## 7️⃣ Billing Workflow

### Actors

- Billing Clerk

### Steps

1. **View Billing Queue**

   - Clerk navigates to Billing page
   - Queue shows patients with:
     - Completed consultations
     - Unpaid bills
     - Partially paid
   - Each card displays:
     - Patient info
     - Services rendered
     - Total amount
     - Status badge

2. **Select Patient**

   - Clerk clicks patient card
   - Bill details expand:
     - **Auto-generated line items:**
       - Consultation fee
       - Medications (from pharmacy)
       - Lab tests
       - Procedures
     - Each item shows:
       - Description
       - Quantity
       - Unit price
       - Total

3. **Apply Discounts**

   - Clerk can:
     - Add discount (percentage or fixed)
     - Apply insurance coverage
     - Add adjustments
   - Total recalculates in real-time

4. **Generate Invoice**

   - System creates invoice:
     - Invoice Number (INV-YYYYMMDD-XXXX)
     - Date & time
     - Patient details
     - Itemized charges
     - Subtotal
     - Discounts
     - Tax (if applicable)
     - **Total Amount**

5. **Process Payment**

   - Payment modal opens
   - Fields:
     - Payment method dropdown:
       - Cash
       - Card
       - Mobile Money
       - Insurance
       - Bank Transfer
     - Amount paid
     - Reference number (for electronic payments)
   - Change calculated automatically (for cash)

6. **Record Payment**

   - Clerk clicks "Record Payment"
   - System:
     - Creates payment record
     - Updates bill status:
       - PAID (if full amount)
       - PARTIALLY_PAID (if partial)
     - Links payment to bill
     - Creates audit log

7. **Print Receipt**

   - Receipt auto-generates:
     - Hospital details
     - Receipt number
     - Patient info
     - Services rendered
     - Amount paid
     - Payment method
     - Balance (if any)
     - QR code (for verification)
   - Print button triggers printer
   - PDF also saved

8. **Complete Transaction**
   - Success toast notification
   - Bill status updated
   - Patient can leave
   - Record archived for reporting

---

## 🎨 UI/UX Enhancements Across All Flows

### Animations

- **Page Transitions**: Smooth fade + slide (300ms)
- **Modal Entry**: Scale from 0.95 to 1.0 with fade
- **Card Hover**: Subtle lift (-2px translate) + shadow increase
- **Button Press**: Scale to 0.98
- **List Items**: Slide up sequentially (100ms stagger)
- **Loading States**: Skeleton loaders + pulse animation
- **Toast Notifications**: Slide in from top-right

### Micro-interactions

- **Form Focus**: Blue ring + slight scale
- **Checkbox Toggle**: Smooth check animation
- **Dropdown Open**: Slide down with ease-out
- **Tab Switch**: Underline slides to active tab
- **Search Results**: Fade in as results load
- **Save Success**: Button turns green briefly

### Error Handling

- **Inline Errors**: Red text below field
- **Toast Errors**: Red background, shake animation
- **Network Errors**: Retry button + explanation
- **Validation**: Real-time feedback
- **Empty States**: Friendly illustrations + helpful text

### Accessibility

- **Keyboard Navigation**: Full support
- **Screen Reader**: ARIA labels on all interactive elements
- **High Contrast**: Colors meet WCAG AA
- **Focus Indicators**: Clear and visible
- **Error Announcements**: Screen reader alerts
