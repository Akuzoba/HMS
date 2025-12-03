# Lab Module Workflow

## Overview

The Lab module manages the complete lifecycle of laboratory tests from ordering to result verification.

## Lab Order Status Flow

```
┌──────────┐    ┌──────────────────┐    ┌─────────────┐    ┌───────────┐
│ PENDING  │ -> │ SAMPLE_COLLECTED │ -> │ IN_PROGRESS │ -> │ COMPLETED │
└──────────┘    └──────────────────┘    └─────────────┘    └───────────┘
     │
     └──────────────────────────────────────────────────> CANCELLED
```

## Detailed Workflow

### 1. **PENDING** - Order Created

- **Who:** Doctor creates the order from Consultation page
- **What happens:**
  - Lab order is created with selected tests
  - Order appears in Lab Queue with status "PENDING"
  - Priority is set (ROUTINE, URGENT, STAT)
- **Button shown:** "Collect Sample"

### 2. **SAMPLE_COLLECTED** - Sample Taken

- **Who:** Lab Technician clicks "Collect Sample"
- **What happens:**
  - Status changes to "SAMPLE_COLLECTED"
  - Indicates patient's sample has been taken
  - Ready for testing/processing
- **Button shown:** "Enter Results"

### 3. **IN_PROGRESS** - Results Entered

- **Who:** Lab Technician enters test results
- **What happens:**
  - Lab results are saved to database
  - Status changes to "IN_PROGRESS"
  - Awaiting verification by senior staff
- **Button shown:** "Verify & Complete"

### 4. **COMPLETED** - Results Verified

- **Who:** Lab Technician/Pathologist verifies results
- **What happens:**
  - Results are verified and timestamped
  - Status changes to "COMPLETED"
  - Order is removed from pending queue
  - Results are available for doctor to view

### 5. **CANCELLED** - Order Cancelled

- **Who:** Can be cancelled before completion
- **What happens:**
  - Order is marked as cancelled
  - Reason is stored in clinical notes
  - Removed from active queue

---

## User Interface Walkthrough

### Lab Queue (Left Panel)

- Shows all pending orders (PENDING, SAMPLE_COLLECTED, IN_PROGRESS)
- Color-coded by priority:
  - **STAT** - Red (immediate)
  - **URGENT** - Orange
  - **ROUTINE** - Gray (normal)
- Status shown as badge on each order card
- Click an order to see details

### Order Details (Right Panel)

When you select an order:

1. **Header** - Patient name, order number, priority
2. **Status & Actions** - Current status with action buttons:
   - "Collect Sample" (when PENDING)
   - "Enter Results" (when SAMPLE_COLLECTED)
   - "Verify & Complete" (when IN_PROGRESS)
3. **Clinical Notes** - Doctor's notes about why tests were ordered
4. **Ordered Tests** - List of all tests in this order
5. **Results** - Table showing results (if entered)

---

## Common Actions

### Collecting a Sample

1. Select the order from the queue
2. Click "Collect Sample" button
3. Status changes to "SAMPLE_COLLECTED"
4. The action button changes to "Enter Results"

### Entering Results

1. Click "Enter Results" when status is SAMPLE_COLLECTED
2. Modal opens with form fields for each test:
   - **Result** - The test value (required)
   - **Unit** - Measurement unit (pre-filled from test catalog)
   - **Normal Range** - Reference range (pre-filled)
   - **Flag** - NORMAL, HIGH, LOW, or CRITICAL
   - **Notes** - Additional comments
3. Fill in all results
4. Click "Submit Results"
5. Status changes to "IN_PROGRESS"

### Verifying Results

1. Review the entered results in the Results table
2. Click "Verify & Complete"
3. Results are timestamped with verifier's name
4. Order is marked as COMPLETED
5. Removed from pending queue

---

## Test Catalog

The Test Catalog tab allows managing available lab tests:

### Test Information

- **Test Code** - Unique identifier (e.g., CBC, BMP, LFT)
- **Test Name** - Full name
- **Category** - Hematology, Chemistry, Urinalysis, etc.
- **Sample Type** - Blood, Urine, Stool, etc.
- **Normal Range** - Reference values
- **Unit** - Measurement unit
- **Price** - Cost of the test
- **TAT** - Turn Around Time (processing time)

---

## Tips for Lab Staff

1. **Process STAT orders first** - They appear at the top and are color-coded red
2. **Refresh the queue** - Use the search or refresh if you don't see new orders
3. **Double-check results** - Verify flag assignments (CRITICAL, HIGH, LOW) are correct
4. **Add notes** - Use the notes field for any abnormalities or observations
5. **Complete workflow** - Always verify results to complete the order

---

## Troubleshooting

### "Sample already collected" error

- The sample was already collected (possibly by another user)
- Refresh the page to see the updated status

### Order not appearing in queue

- Only PENDING, SAMPLE_COLLECTED, and IN_PROGRESS orders show in queue
- COMPLETED orders are removed from the queue
- Check the Lab Orders list for historical orders

### Results not saving

- Ensure all result fields are filled in
- Check for network connectivity
- Try refreshing and re-entering

---

## Data Flow

```
Doctor (Consultation)              Lab Technician
        │                                │
        │ Order Lab Tests                │
        ▼                                │
   ┌─────────┐                          │
   │ PENDING │ ─────────────────────────┤
   └─────────┘                          │
                                        ▼
                              ┌──────────────────┐
                              │ SAMPLE_COLLECTED │
                              └──────────────────┘
                                        │
                                        │ Enter Results
                                        ▼
                              ┌─────────────┐
                              │ IN_PROGRESS │
                              └─────────────┘
                                        │
                                        │ Verify Results
                                        ▼
                              ┌───────────┐
                              │ COMPLETED │ ──► Results visible
                              └───────────┘      to Doctor
```
