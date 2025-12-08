import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // =====================
  // 1. CLEAN EXISTING DATA
  // =====================
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.billItem.deleteMany();
  await prisma.bill.deleteMany();
  await prisma.visitCharge.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.labTest.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.drug.deleteMany();
  await prisma.hospitalService.deleteMany();
  await prisma.diagnosis.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  console.log('✅ Cleaned existing data\n');

  // =====================
  // 2. CREATE ROLES
  // =====================
  console.log('👥 Creating roles...');
  const roles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'ADMIN',
        description: 'System administrator with full access',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          patients: ['create', 'read', 'update', 'delete'],
          visits: ['create', 'read', 'update', 'delete'],
          billing: ['create', 'read', 'update', 'delete'],
          reports: ['read'],
          settings: ['read', 'update'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'FRONT_DESK',
        description: 'Front desk staff for patient registration',
        permissions: JSON.stringify({
          patients: ['create', 'read', 'update'],
          visits: ['create', 'read'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'NURSE',
        description: 'Nurse for triage and vital signs',
        permissions: JSON.stringify({
          patients: ['read'],
          visits: ['read', 'update'],
          vitals: ['create', 'read', 'update'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'DOCTOR',
        description: 'Doctor for consultations and prescriptions',
        permissions: JSON.stringify({
          patients: ['read'],
          visits: ['read', 'update'],
          consultations: ['create', 'read', 'update'],
          prescriptions: ['create', 'read', 'update'],
          labOrders: ['create', 'read'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'PHARMACIST',
        description: 'Pharmacist for medication dispensing',
        permissions: JSON.stringify({
          prescriptions: ['read', 'update'],
          drugs: ['create', 'read', 'update'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'LAB_TECH',
        description: 'Laboratory technician for tests and results',
        permissions: JSON.stringify({
          labOrders: ['read', 'update'],
          labResults: ['create', 'read', 'update'],
          labTests: ['create', 'read', 'update'],
        }),
      },
    }),
    prisma.role.create({
      data: {
        name: 'BILLING_CLERK',
        description: 'Billing clerk for payments and invoices',
        permissions: JSON.stringify({
          bills: ['create', 'read', 'update'],
          payments: ['create', 'read'],
        }),
      },
    }),
  ]);
  console.log(`✅ Created ${roles.length} roles\n`);

  // =====================
  // 3. CREATE USERS
  // =====================
  console.log('👤 Creating users...');
  const hashedPassword = await bcrypt.hash('Admin123!', 12);

  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@hospital.com',
        username: 'admin',
        passwordHash: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '+233244000001',
        roleId: roles[0].id, // ADMIN
      },
    }),
    // Front desk
    prisma.user.create({
      data: {
        email: 'frontdesk@hospital.com',
        username: 'frontdesk',
        passwordHash: hashedPassword,
        firstName: 'Grace',
        lastName: 'Mensah',
        phoneNumber: '+233244000002',
        roleId: roles[1].id, // FRONT_DESK
      },
    }),
    // Nurse
    prisma.user.create({
      data: {
        email: 'nurse@hospital.com',
        username: 'nurse',
        passwordHash: hashedPassword,
        firstName: 'Abena',
        lastName: 'Osei',
        phoneNumber: '+233244000003',
        roleId: roles[2].id, // NURSE
      },
    }),
    // Doctor
    prisma.user.create({
      data: {
        email: 'doctor@hospital.com',
        username: 'doctor',
        passwordHash: hashedPassword,
        firstName: 'Dr. Kwame',
        lastName: 'Asante',
        phoneNumber: '+233244000004',
        roleId: roles[3].id, // DOCTOR
      },
    }),
    // Pharmacist
    prisma.user.create({
      data: {
        email: 'pharmacist@hospital.com',
        username: 'pharmacist',
        passwordHash: hashedPassword,
        firstName: 'Ama',
        lastName: 'Boateng',
        phoneNumber: '+233244000005',
        roleId: roles[4].id, // PHARMACIST
      },
    }),
    // Lab Tech
    prisma.user.create({
      data: {
        email: 'labtech@hospital.com',
        username: 'labtech',
        passwordHash: hashedPassword,
        firstName: 'Kofi',
        lastName: 'Adjei',
        phoneNumber: '+233244000006',
        roleId: roles[5].id, // LAB_TECH
      },
    }),
    // Billing Clerk
    prisma.user.create({
      data: {
        email: 'billing@hospital.com',
        username: 'billing',
        passwordHash: hashedPassword,
        firstName: 'Akosua',
        lastName: 'Darko',
        phoneNumber: '+233244000007',
        roleId: roles[6].id, // BILLING_CLERK
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users\n`);

  // =====================
  // 4. CREATE LAB TESTS
  // =====================
  console.log('🔬 Creating lab tests...');
  const labTests = await Promise.all([
    prisma.labTest.create({
      data: {
        testCode: 'CBC',
        testName: 'Complete Blood Count (CBC)',
        category: 'HEMATOLOGY',
        description: 'Full blood count analysis',
        sampleType: 'BLOOD',
        normalRange: 'WBC: 4-11, RBC: 4.5-5.5, Hgb: 12-16',
        unit: 'cells/µL',
        price: 50.0,
        turnaroundTime: 2, // 2 hours
      },
    }),
    prisma.labTest.create({
      data: {
        testCode: 'FBS',
        testName: 'Blood Glucose (Fasting)',
        category: 'BIOCHEMISTRY',
        description: 'Fasting blood sugar test',
        sampleType: 'BLOOD',
        normalRange: '70-100 mg/dL',
        unit: 'mg/dL',
        price: 20.0,
        turnaroundTime: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        testCode: 'MAL-RDT',
        testName: 'Malaria Test (RDT)',
        category: 'MICROBIOLOGY',
        description: 'Rapid diagnostic test for malaria',
        sampleType: 'BLOOD',
        normalRange: 'Negative',
        unit: 'Positive/Negative',
        price: 15.0,
        turnaroundTime: 1,
      },
    }),
    prisma.labTest.create({
      data: {
        testCode: 'LIPID',
        testName: 'Lipid Profile',
        category: 'BIOCHEMISTRY',
        description: 'Cholesterol and triglycerides',
        sampleType: 'BLOOD',
        normalRange: 'Total: <200, HDL: >40, LDL: <100',
        unit: 'mg/dL',
        price: 80.0,
        turnaroundTime: 3,
      },
    }),
    prisma.labTest.create({
      data: {
        testCode: 'URINE',
        testName: 'Urinalysis',
        category: 'BIOCHEMISTRY',
        description: 'Complete urine analysis',
        sampleType: 'URINE',
        normalRange: 'pH: 4.5-8, Specific Gravity: 1.005-1.030',
        unit: 'Various',
        price: 25.0,
        turnaroundTime: 2,
      },
    }),
  ]);
  console.log(`✅ Created ${labTests.length} lab tests\n`);

  // =====================
  // 5. CREATE LAB TESTS AS SERVICES
  // =====================
  console.log('🔬 Creating lab test services...');
  const labTestServices = await Promise.all(
    labTests.map(test => 
      prisma.hospitalService.create({
        data: {
          serviceCode: `LAB-${test.testCode}`,
          serviceName: test.testName,
          category: 'LABORATORY',
          description: test.description || `Lab test: ${test.testName}`,
          unitPrice: test.price || 0,
        },
      })
    )
  );
  console.log(`✅ Created ${labTestServices.length} lab test services\n`);

  // =====================
  // 6. CREATE DRUGS
  // =====================
  console.log('💊 Creating drugs...');
  const drugs = await Promise.all([
    prisma.drug.create({
      data: {
        drugName: 'Paracetamol 500mg',
        genericName: 'Acetaminophen',
        manufacturer: 'GSK',
        category: 'ANALGESIC',
        dosageForm: 'TABLET',
        strength: '500mg',
        unitPrice: 0.5,
        stockQuantity: 1000,
        reorderLevel: 200,
        drugCode: 'PCM-500',
        unitOfMeasure: 'Tablet',
      },
    }),
    prisma.drug.create({
      data: {
        drugName: 'Amoxicillin 500mg',
        genericName: 'Amoxicillin',
        manufacturer: 'GSK',
        category: 'ANTIBIOTIC',
        dosageForm: 'CAPSULE',
        strength: '500mg',
        unitPrice: 1.5,
        stockQuantity: 500,
        reorderLevel: 100,
        drugCode: 'AMX-500',
        unitOfMeasure: 'Capsule',
      },
    }),
    prisma.drug.create({
      data: {
        drugName: 'Artemether-Lumefantrine (Coartem)',
        genericName: 'Artemether-Lumefantrine',
        manufacturer: 'Novartis',
        category: 'ANTIMALARIAL',
        dosageForm: 'TABLET',
        strength: '20/120mg',
        unitPrice: 8.0,
        stockQuantity: 300,
        reorderLevel: 50,
        drugCode: 'ALU-20120',
        unitOfMeasure: 'Tablet',
      },
    }),
    prisma.drug.create({
      data: {
        drugName: 'Metformin 500mg',
        genericName: 'Metformin Hydrochloride',
        manufacturer: 'Merck',
        category: 'ANTIDIABETIC',
        dosageForm: 'TABLET',
        strength: '500mg',
        unitPrice: 0.8,
        stockQuantity: 800,
        reorderLevel: 150,
        drugCode: 'MET-500',
        unitOfMeasure: 'Tablet',
      },
    }),
    prisma.drug.create({
      data: {
        drugName: 'Omeprazole 20mg',
        genericName: 'Omeprazole',
        manufacturer: 'AstraZeneca',
        category: 'ANTACID',
        dosageForm: 'CAPSULE',
        strength: '20mg',
        unitPrice: 1.2,
        stockQuantity: 400,
        reorderLevel: 80,
        drugCode: 'OMP-20',
        unitOfMeasure: 'Capsule',
      },
    }),
  ]);
  console.log(`✅ Created ${drugs.length} drugs\n`);

  // =====================
  // 6. CREATE HOSPITAL SERVICES
  // =====================
  console.log('🏥 Creating hospital services...');
  const hospitalServices = await Promise.all([
    // Consultation Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'CONS-GEN',
        serviceName: 'General Consultation',
        category: 'CONSULTATION',
        description: 'General outpatient consultation with a doctor',
        unitPrice: 50.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'CONS-SPE',
        serviceName: 'Specialist Consultation',
        category: 'CONSULTATION',
        description: 'Consultation with a specialist doctor',
        unitPrice: 100.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'CONS-EME',
        serviceName: 'Emergency Consultation',
        category: 'CONSULTATION',
        description: 'Emergency room consultation',
        unitPrice: 150.0,
      },
    }),
    
    // Nursing Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'NRS-TRI',
        serviceName: 'Triage Assessment',
        category: 'NURSING',
        description: 'Initial patient assessment and vital signs',
        unitPrice: 20.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'NRS-INJ',
        serviceName: 'Injection Administration',
        category: 'NURSING',
        description: 'Administration of injection medication',
        unitPrice: 15.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'NRS-DRS',
        serviceName: 'Wound Dressing',
        category: 'NURSING',
        description: 'Wound cleaning and dressing change',
        unitPrice: 30.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'NRS-IVD',
        serviceName: 'IV Drip Setup',
        category: 'NURSING',
        description: 'Intravenous drip insertion and setup',
        unitPrice: 40.0,
      },
    }),
    
    // Procedure Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'PROC-MIN',
        serviceName: 'Minor Surgery',
        category: 'PROCEDURE',
        description: 'Minor surgical procedures (suturing, excision)',
        unitPrice: 200.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'PROC-ECG',
        serviceName: 'ECG/EKG',
        category: 'PROCEDURE',
        description: 'Electrocardiogram test',
        unitPrice: 60.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'PROC-NEB',
        serviceName: 'Nebulization',
        category: 'PROCEDURE',
        description: 'Nebulizer treatment for respiratory conditions',
        unitPrice: 25.0,
      },
    }),
    
    // Radiology Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'RAD-XRAY',
        serviceName: 'X-Ray',
        category: 'RADIOLOGY',
        description: 'Standard X-ray imaging',
        unitPrice: 80.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'RAD-US',
        serviceName: 'Ultrasound Scan',
        category: 'RADIOLOGY',
        description: 'Ultrasound imaging',
        unitPrice: 120.0,
      },
    }),
    
    // Admission Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'ADM-GEN',
        serviceName: 'General Ward (per day)',
        category: 'ADMISSION',
        description: 'General ward bed per day',
        unitPrice: 100.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'ADM-PRI',
        serviceName: 'Private Ward (per day)',
        category: 'ADMISSION',
        description: 'Private ward bed per day',
        unitPrice: 250.0,
      },
    }),
    
    // Other Services
    prisma.hospitalService.create({
      data: {
        serviceCode: 'OTH-REG',
        serviceName: 'Registration Fee',
        category: 'OTHER',
        description: 'New patient registration fee',
        unitPrice: 10.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'OTH-MED',
        serviceName: 'Medical Report',
        category: 'OTHER',
        description: 'Medical report or certificate',
        unitPrice: 50.0,
      },
    }),
    prisma.hospitalService.create({
      data: {
        serviceCode: 'OTH-AMB',
        serviceName: 'Ambulance Service',
        category: 'OTHER',
        description: 'Ambulance transportation',
        unitPrice: 200.0,
      },
    }),
  ]);
  console.log(`✅ Created ${hospitalServices.length} hospital services\n`);

  // =====================
  // 7. CREATE SAMPLE PATIENTS
  // =====================
  console.log('🏥 Creating sample patients...');
  
  const ghanaianFirstNames = [
    'Kwame', 'Kofi', 'Kwasi', 'Yaw', 'Kwabena',
    'Akosua', 'Abena', 'Ama', 'Yaa', 'Efua',
    'Kojo', 'Kwadwo', 'Fiifi', 'Ekow', 'Ebo',
    'Adjoa', 'Adwoa', 'Abenaa', 'Akua', 'Afua',
  ];

  const ghanaianLastNames = [
    'Mensah', 'Asante', 'Boateng', 'Osei', 'Adjei',
    'Darko', 'Owusu', 'Agyeman', 'Anokye', 'Appiah',
    'Sarpong', 'Frimpong', 'Yeboah', 'Acheampong', 'Ofori',
  ];

  const patients = [];
  const today = new Date();
  const currentDate = today.toISOString().split('T')[0].replace(/-/g, '');

  for (let i = 0; i < 20; i++) {
    const firstName = ghanaianFirstNames[Math.floor(Math.random() * ghanaianFirstNames.length)];
    const lastName = ghanaianLastNames[Math.floor(Math.random() * ghanaianLastNames.length)];
    const gender = ['MALE', 'FEMALE'][Math.floor(Math.random() * 2)];
    const bloodGroup = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'][Math.floor(Math.random() * 8)];
    
    // Generate age between 1 and 80
    const age = Math.floor(Math.random() * 80) + 1;
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

    const sequenceNumber = String(i + 1).padStart(4, '0');
    const patientNumber = `PT-${currentDate}-${sequenceNumber}`;

    const emergencyContactName = `${ghanaianFirstNames[Math.floor(Math.random() * ghanaianFirstNames.length)]} ${ghanaianLastNames[Math.floor(Math.random() * ghanaianLastNames.length)]}`;
    const emergencyContactRelationship = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend'][Math.floor(Math.random() * 5)];
    const emergencyContactPhone = `+23324${Math.floor(1000000 + Math.random() * 9000000)}`;

    const patient = await prisma.patient.create({
      data: {
        patientNumber,
        firstName,
        lastName,
        dateOfBirth,
        gender,
        bloodGroup,
        phoneNumber: `+23324${Math.floor(1000000 + Math.random() * 9000000)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        address: `${Math.floor(Math.random() * 500) + 1} ${['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast'][Math.floor(Math.random() * 5)]} Street`,
        city: ['Accra', 'Kumasi', 'Takoradi', 'Tamale', 'Cape Coast'][Math.floor(Math.random() * 5)],
        region: ['Greater Accra', 'Ashanti', 'Western', 'Northern', 'Central'][Math.floor(Math.random() * 5)],
        emergencyContact: `${emergencyContactName} (${emergencyContactRelationship})`,
        emergencyPhone: emergencyContactPhone,
      },
    });
    patients.push(patient);
  }
  console.log(`✅ Created ${patients.length} sample patients\n`);

  // =====================
  // 8. CREATE SAMPLE VISITS
  // =====================
  console.log('📋 Creating sample visits...');
  
  // Create a few visits for the first 5 patients
  const visits = [];
  for (let i = 0; i < 5; i++) {
    const visit = await prisma.visit.create({
      data: {
        visitNumber: `V-${currentDate}-${String(i + 1).padStart(4, '0')}`,
        patientId: patients[i].id,
        visitType: ['OPD', 'EMERGENCY', 'FOLLOW_UP'][Math.floor(Math.random() * 3)],
        chiefComplaint: ['Fever and headache', 'Abdominal pain', 'Cough and cold', 'Body weakness', 'Chest pain'][i],
        status: 'CHECKED_IN',
      },
    });
    visits.push(visit);
  }
  console.log(`✅ Created ${visits.length} sample visits\n`);

  // =====================
  // 9. CREATE DRUG REGIMENS (Smart Autocomplete Templates)
  // =====================
  console.log('💊 Creating drug regimen templates...');
  const drugRegimens = await Promise.all([
    // Antimalarials
    prisma.drugRegimen.create({
      data: {
        drugId: drugs[2].id, // Coartem
        drugName: 'Artemether-Lumefantrine (Coartem)',
        genericName: 'Artemether-Lumefantrine',
        dosageForm: 'TABLET',
        strength: '20/120mg',
        frequency: 'BD',
        frequencyText: 'Twice daily',
        duration: 3,
        durationUnit: 'days',
        instructions: 'Take with fatty food. Complete the full course.',
        indication: 'Malaria',
        category: 'ANTIMALARIAL',
        ageGroup: 'ADULT',
        searchTerms: 'malaria, coartem, alu, artemether, lumefantrine',
        displayText: 'Coartem 20/120mg BD x 3 days',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Artesunate',
        genericName: 'Artesunate',
        dosageForm: 'INJECTION',
        strength: '60mg',
        route: 'IV',
        frequency: 'STAT then 12H',
        frequencyText: 'At 0, 12, 24 hours then daily',
        duration: 7,
        durationUnit: 'days',
        instructions: 'For severe malaria. IV/IM administration. Switch to oral when possible.',
        indication: 'Severe Malaria',
        category: 'ANTIMALARIAL',
        ageGroup: 'ALL',
        searchTerms: 'severe malaria, cerebral malaria, artesunate',
        displayText: 'Artesunate 60mg IV at 0,12,24h then daily',
      },
    }),
    // Antibiotics
    prisma.drugRegimen.create({
      data: {
        drugId: drugs[1].id, // Amoxicillin
        drugName: 'Amoxicillin',
        genericName: 'Amoxicillin',
        dosageForm: 'CAPSULE',
        strength: '500mg',
        frequency: 'TDS',
        frequencyText: 'Three times daily',
        duration: 5,
        durationUnit: 'days',
        instructions: 'Take before or after meals. Complete the full course of antibiotics.',
        indication: 'Bacterial Infection',
        category: 'ANTIBIOTIC',
        ageGroup: 'ADULT',
        searchTerms: 'amoxicillin, urti, uti, ear infection, sinusitis',
        displayText: 'Amoxicillin 500mg TDS x 5 days',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Ciprofloxacin',
        genericName: 'Ciprofloxacin',
        dosageForm: 'TABLET',
        strength: '500mg',
        frequency: 'BD',
        frequencyText: 'Twice daily',
        duration: 7,
        durationUnit: 'days',
        instructions: 'Take 2 hours before or 6 hours after antacids. Avoid dairy products.',
        indication: 'Typhoid Fever',
        category: 'ANTIBIOTIC',
        ageGroup: 'ADULT',
        searchTerms: 'typhoid, cipro, ciprofloxacin, uti, gastroenteritis',
        displayText: 'Ciprofloxacin 500mg BD x 7 days',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Azithromycin',
        genericName: 'Azithromycin',
        dosageForm: 'TABLET',
        strength: '500mg',
        frequency: 'OD',
        frequencyText: 'Once daily',
        duration: 3,
        durationUnit: 'days',
        instructions: 'Take on empty stomach, 1 hour before or 2 hours after meals.',
        indication: 'Respiratory Infection',
        category: 'ANTIBIOTIC',
        ageGroup: 'ADULT',
        searchTerms: 'azithromycin, zithromax, pneumonia, bronchitis',
        displayText: 'Azithromycin 500mg OD x 3 days',
      },
    }),
    // Analgesics
    prisma.drugRegimen.create({
      data: {
        drugId: drugs[0].id, // Paracetamol
        drugName: 'Paracetamol',
        genericName: 'Acetaminophen',
        dosageForm: 'TABLET',
        strength: '1g',
        frequency: 'QID',
        frequencyText: 'Four times daily',
        instructions: 'Do not exceed 4g daily. Space doses at least 4 hours apart.',
        indication: 'Fever/Pain',
        category: 'ANALGESIC',
        ageGroup: 'ADULT',
        searchTerms: 'paracetamol, fever, headache, pain, pcm',
        displayText: 'Paracetamol 1g QID PRN',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Ibuprofen',
        genericName: 'Ibuprofen',
        dosageForm: 'TABLET',
        strength: '400mg',
        frequency: 'TDS',
        frequencyText: 'Three times daily',
        instructions: 'Take with food to reduce stomach upset. Avoid in renal impairment.',
        indication: 'Pain/Inflammation',
        category: 'NSAID',
        ageGroup: 'ADULT',
        searchTerms: 'ibuprofen, brufen, pain, inflammation, arthritis',
        displayText: 'Ibuprofen 400mg TDS PRN',
      },
    }),
    // Gastrointestinal
    prisma.drugRegimen.create({
      data: {
        drugId: drugs[4].id, // Omeprazole
        drugName: 'Omeprazole',
        genericName: 'Omeprazole',
        dosageForm: 'CAPSULE',
        strength: '20mg',
        frequency: 'OD',
        frequencyText: 'Once daily before breakfast',
        duration: 14,
        durationUnit: 'days',
        instructions: 'Take 30 minutes before breakfast. Do not crush or chew capsule.',
        indication: 'Gastritis/GERD',
        category: 'PPI',
        ageGroup: 'ADULT',
        searchTerms: 'omeprazole, gastritis, gerd, ulcer, heartburn',
        displayText: 'Omeprazole 20mg OD x 2 weeks',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Metronidazole',
        genericName: 'Metronidazole',
        dosageForm: 'TABLET',
        strength: '400mg',
        frequency: 'TDS',
        frequencyText: 'Three times daily',
        duration: 7,
        durationUnit: 'days',
        instructions: 'Avoid alcohol during treatment and 48 hours after. Take with food.',
        indication: 'Amoebiasis/Giardiasis',
        category: 'ANTIBIOTIC',
        ageGroup: 'ADULT',
        searchTerms: 'metronidazole, flagyl, amoeba, giardia, bv',
        displayText: 'Metronidazole 400mg TDS x 7 days',
      },
    }),
    // Antihypertensives
    prisma.drugRegimen.create({
      data: {
        drugName: 'Amlodipine',
        genericName: 'Amlodipine',
        dosageForm: 'TABLET',
        strength: '5mg',
        frequency: 'OD',
        frequencyText: 'Once daily',
        instructions: 'Take at the same time each day. Monitor blood pressure regularly.',
        indication: 'Hypertension',
        category: 'ANTIHYPERTENSIVE',
        ageGroup: 'ADULT',
        searchTerms: 'amlodipine, norvasc, hypertension, blood pressure, bp',
        displayText: 'Amlodipine 5mg OD',
      },
    }),
    prisma.drugRegimen.create({
      data: {
        drugName: 'Lisinopril',
        genericName: 'Lisinopril',
        dosageForm: 'TABLET',
        strength: '10mg',
        frequency: 'OD',
        frequencyText: 'Once daily',
        instructions: 'Monitor potassium levels. May cause dry cough.',
        indication: 'Hypertension',
        category: 'ACE_INHIBITOR',
        ageGroup: 'ADULT',
        searchTerms: 'lisinopril, ace inhibitor, hypertension, heart failure',
        displayText: 'Lisinopril 10mg OD',
      },
    }),
    // Antidiabetics
    prisma.drugRegimen.create({
      data: {
        drugId: drugs[3].id, // Metformin
        drugName: 'Metformin',
        genericName: 'Metformin Hydrochloride',
        dosageForm: 'TABLET',
        strength: '500mg',
        frequency: 'BD',
        frequencyText: 'Twice daily with meals',
        instructions: 'Take with meals to reduce GI upset. Monitor renal function.',
        indication: 'Type 2 Diabetes',
        category: 'ANTIDIABETIC',
        ageGroup: 'ADULT',
        searchTerms: 'metformin, glucophage, diabetes, dm, sugar',
        displayText: 'Metformin 500mg BD',
      },
    }),
  ]);
  console.log(`✅ Created ${drugRegimens.length} drug regimen templates\n`);

  // =====================
  // 10. CREATE EXAM SECTIONS (Dynamic Physical Exam)
  // =====================
  console.log('🩺 Creating examination section templates...');
  const examSections = await Promise.all([
    prisma.examSection.create({
      data: {
        sectionName: 'General Examination',
        sectionCode: 'GENERAL',
        description: 'General physical examination findings',
        sortOrder: 1,
        fields: JSON.stringify([
          { name: 'appearance', label: 'General Appearance', type: 'select', options: ['Well-looking', 'Ill-looking', 'Toxic', 'Cachectic', 'Obese'] },
          { name: 'consciousness', label: 'Level of Consciousness', type: 'select', options: ['Alert', 'Drowsy', 'Confused', 'Unconscious'] },
          { name: 'hydration', label: 'Hydration Status', type: 'select', options: ['Well hydrated', 'Mild dehydration', 'Moderate dehydration', 'Severe dehydration'] },
          { name: 'pallor', label: 'Pallor', type: 'select', options: ['Absent', 'Mild', 'Moderate', 'Severe'] },
          { name: 'jaundice', label: 'Jaundice', type: 'select', options: ['Absent', 'Present (mild)', 'Present (moderate)', 'Present (severe)'] },
          { name: 'cyanosis', label: 'Cyanosis', type: 'select', options: ['Absent', 'Peripheral', 'Central'] },
          { name: 'edema', label: 'Peripheral Edema', type: 'select', options: ['Absent', 'Pedal (+)', 'Pedal (++)', 'Generalized'] },
          { name: 'lymphNodes', label: 'Lymphadenopathy', type: 'select', options: ['Absent', 'Cervical', 'Axillary', 'Inguinal', 'Generalized'] },
        ]),
        defaultFindings: 'Patient is well-looking, alert and oriented. Well hydrated. No pallor, jaundice, cyanosis, or peripheral edema. No lymphadenopathy.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Cardiovascular Examination',
        sectionCode: 'CVS',
        description: 'Cardiovascular system examination',
        sortOrder: 2,
        fields: JSON.stringify([
          { name: 'heartRate', label: 'Heart Rate', type: 'number', unit: 'bpm', normalRange: '60-100' },
          { name: 'rhythm', label: 'Rhythm', type: 'select', options: ['Regular', 'Irregular', 'Irregularly irregular'] },
          { name: 'jvp', label: 'JVP', type: 'select', options: ['Normal', 'Elevated', 'Not visible'] },
          { name: 'heartSounds', label: 'Heart Sounds', type: 'select', options: ['S1 S2 present', 'S3 gallop', 'S4 gallop', 'Murmur present'] },
          { name: 'murmur', label: 'Murmur Details', type: 'text', conditional: 'heartSounds=Murmur present' },
          { name: 'pulses', label: 'Peripheral Pulses', type: 'select', options: ['All present and equal', 'Weak', 'Bounding', 'Absent'] },
          { name: 'capillaryRefill', label: 'Capillary Refill', type: 'select', options: ['< 2 seconds', '2-3 seconds', '> 3 seconds'] },
        ]),
        defaultFindings: 'Heart rate regular at 72 bpm. JVP not elevated. S1 S2 present, no murmurs. All peripheral pulses present and equal. Capillary refill < 2 seconds.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Respiratory Examination',
        sectionCode: 'RESP',
        description: 'Respiratory system examination',
        sortOrder: 3,
        fields: JSON.stringify([
          { name: 'respiratoryRate', label: 'Respiratory Rate', type: 'number', unit: 'breaths/min', normalRange: '12-20' },
          { name: 'pattern', label: 'Breathing Pattern', type: 'select', options: ['Normal', 'Tachypneic', 'Labored', 'Kussmaul', 'Cheyne-Stokes'] },
          { name: 'chestMovement', label: 'Chest Movement', type: 'select', options: ['Symmetrical', 'Asymmetrical', 'Reduced on left', 'Reduced on right'] },
          { name: 'percussion', label: 'Percussion Note', type: 'select', options: ['Resonant', 'Dull', 'Stony dull', 'Hyperresonant'] },
          { name: 'breathSounds', label: 'Breath Sounds', type: 'select', options: ['Vesicular', 'Bronchial', 'Reduced', 'Absent'] },
          { name: 'addedSounds', label: 'Added Sounds', type: 'multiselect', options: ['None', 'Crackles', 'Wheeze', 'Rhonchi', 'Pleural rub'] },
          { name: 'oxygenSaturation', label: 'SpO2', type: 'number', unit: '%', normalRange: '95-100' },
        ]),
        defaultFindings: 'RR 16/min, normal breathing pattern. Chest movement symmetrical. Percussion note resonant bilaterally. Vesicular breath sounds, no added sounds. SpO2 98% on room air.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Abdominal Examination',
        sectionCode: 'ABDO',
        description: 'Abdominal examination',
        sortOrder: 4,
        fields: JSON.stringify([
          { name: 'inspection', label: 'Inspection', type: 'select', options: ['Flat', 'Distended', 'Scaphoid', 'Visible masses', 'Surgical scars'] },
          { name: 'tenderness', label: 'Tenderness', type: 'multiselect', options: ['None', 'Epigastric', 'RUQ', 'LUQ', 'RLQ', 'LLQ', 'Suprapubic', 'Generalized'] },
          { name: 'guarding', label: 'Guarding/Rigidity', type: 'select', options: ['Absent', 'Present (voluntary)', 'Present (involuntary)', 'Board-like'] },
          { name: 'rebound', label: 'Rebound Tenderness', type: 'select', options: ['Absent', 'Present'] },
          { name: 'bowelSounds', label: 'Bowel Sounds', type: 'select', options: ['Present and normal', 'Hyperactive', 'Hypoactive', 'Absent'] },
          { name: 'liver', label: 'Liver', type: 'select', options: ['Not palpable', 'Palpable (smooth)', 'Palpable (nodular)', 'Tender'] },
          { name: 'spleen', label: 'Spleen', type: 'select', options: ['Not palpable', 'Palpable', 'Enlarged'] },
          { name: 'masses', label: 'Masses', type: 'text' },
        ]),
        defaultFindings: 'Abdomen flat, soft, non-tender. No guarding or rebound tenderness. Bowel sounds present and normal. Liver and spleen not palpable. No masses.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Neurological Examination',
        sectionCode: 'NEURO',
        description: 'Neurological examination',
        sortOrder: 5,
        fields: JSON.stringify([
          { name: 'gcs', label: 'GCS Score', type: 'composite', components: ['Eye (1-4)', 'Verbal (1-5)', 'Motor (1-6)'] },
          { name: 'orientation', label: 'Orientation', type: 'multiselect', options: ['Person', 'Place', 'Time'] },
          { name: 'pupils', label: 'Pupils', type: 'select', options: ['PERRL', 'Unequal', 'Fixed dilated', 'Pinpoint'] },
          { name: 'motorPower', label: 'Motor Power', type: 'select', options: ['5/5 all limbs', 'Weakness present', 'Paralysis'] },
          { name: 'sensation', label: 'Sensation', type: 'select', options: ['Intact', 'Reduced', 'Absent'] },
          { name: 'reflexes', label: 'Deep Tendon Reflexes', type: 'select', options: ['Normal', 'Hyperreflexia', 'Hyporeflexia', 'Absent'] },
          { name: 'coordination', label: 'Coordination', type: 'select', options: ['Normal', 'Ataxia', 'Dysmetria'] },
          { name: 'cranialNerves', label: 'Cranial Nerves', type: 'select', options: ['Intact', 'Deficit present'] },
        ]),
        defaultFindings: 'GCS 15/15. Alert and oriented to person, place, and time. Pupils equal, round, reactive to light. Motor power 5/5 all limbs. Sensation intact. Reflexes normal. Coordination normal. Cranial nerves intact.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Musculoskeletal Examination',
        sectionCode: 'MSK',
        description: 'Musculoskeletal examination',
        sortOrder: 6,
        fields: JSON.stringify([
          { name: 'gait', label: 'Gait', type: 'select', options: ['Normal', 'Antalgic', 'Ataxic', 'Spastic', 'Unable to walk'] },
          { name: 'joints', label: 'Joints', type: 'select', options: ['Normal', 'Swelling', 'Tenderness', 'Deformity', 'Limited ROM'] },
          { name: 'affectedJoint', label: 'Affected Joint(s)', type: 'text', conditional: 'joints!=Normal' },
          { name: 'spine', label: 'Spine', type: 'select', options: ['Normal', 'Tenderness', 'Limited mobility', 'Deformity'] },
          { name: 'muscleWasting', label: 'Muscle Wasting', type: 'select', options: ['Absent', 'Present'] },
        ]),
        defaultFindings: 'Gait normal. Joints normal, full range of motion. Spine normal. No muscle wasting.',
      },
    }),
    prisma.examSection.create({
      data: {
        sectionName: 'Skin Examination',
        sectionCode: 'SKIN',
        description: 'Skin and integumentary examination',
        sortOrder: 7,
        fields: JSON.stringify([
          { name: 'color', label: 'Color', type: 'select', options: ['Normal', 'Pale', 'Jaundiced', 'Cyanotic', 'Flushed'] },
          { name: 'texture', label: 'Texture', type: 'select', options: ['Normal', 'Dry', 'Moist', 'Sweaty'] },
          { name: 'temperature', label: 'Temperature', type: 'select', options: ['Normal', 'Warm', 'Hot', 'Cold'] },
          { name: 'lesions', label: 'Lesions', type: 'multiselect', options: ['None', 'Rash', 'Ulcer', 'Wound', 'Petechiae', 'Bruising'] },
          { name: 'lesionDetails', label: 'Lesion Details', type: 'text', conditional: 'lesions!=None' },
        ]),
        defaultFindings: 'Skin normal color, texture, and temperature. No lesions.',
      },
    }),
  ]);
  console.log(`✅ Created ${examSections.length} examination section templates\n`);

  // =====================
  // 11. CREATE CLINICAL TEMPLATES (Sentence Builders)
  // =====================
  console.log('📝 Creating clinical sentence builder templates...');
  const clinicalTemplates = await Promise.all([
    // Malaria History Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'FEVER',
        templateName: 'Malaria History',
        template: 'Patient presents with {duration} history of {mainSymptoms}. The fever is {feverPattern}. Associated symptoms include {associatedSymptoms}. Patient {travelHistory}. {previousTreatment}. No known drug allergies.',
        placeholders: JSON.stringify([
          { name: 'duration', label: 'Duration', type: 'select', options: ['1-day', '2-day', '3-day', '5-day', '1-week', '2-week'], required: true },
          { name: 'mainSymptoms', label: 'Main Symptoms', type: 'multiselect', options: ['fever', 'chills and rigors', 'headache', 'body aches', 'malaise', 'joint pains'], required: true },
          { name: 'feverPattern', label: 'Fever Pattern', type: 'select', options: ['continuous', 'intermittent', 'with chills', 'high-grade', 'low-grade'] },
          { name: 'associatedSymptoms', label: 'Associated Symptoms', type: 'multiselect', options: ['nausea', 'vomiting', 'diarrhea', 'loss of appetite', 'fatigue', 'dizziness', 'sweating'] },
          { name: 'travelHistory', label: 'Travel History', type: 'select', options: ['recently traveled to endemic area', 'lives in endemic area', 'denies recent travel'] },
          { name: 'previousTreatment', label: 'Previous Treatment', type: 'select', options: ['Has not taken any medications', 'Took paracetamol with minimal relief', 'Took antimalarials but symptoms persisted', 'Self-medicated with incomplete course'] },
        ]),
        defaultValues: JSON.stringify({
          duration: '3-day',
          feverPattern: 'intermittent',
          travelHistory: 'lives in endemic area',
          previousTreatment: 'Has not taken any medications'
        }),
        sortOrder: 1,
      },
    }),
    // Typhoid History Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'FEVER',
        templateName: 'Typhoid Fever History',
        template: 'Patient presents with {duration} history of {mainSymptoms}. The fever has been {feverCharacter}. Patient reports {giSymptoms}. Appetite is {appetite}. {waterHistory}. {previousTreatment}.',
        placeholders: JSON.stringify([
          { name: 'duration', label: 'Duration', type: 'select', options: ['3-day', '5-day', '1-week', '10-day', '2-week'], required: true },
          { name: 'mainSymptoms', label: 'Main Symptoms', type: 'multiselect', options: ['continuous fever', 'headache', 'body weakness', 'abdominal discomfort', 'malaise'], required: true },
          { name: 'feverCharacter', label: 'Fever Character', type: 'select', options: ['step-ladder pattern', 'continuous high-grade', 'worse in the evening', 'with relative bradycardia'] },
          { name: 'giSymptoms', label: 'GI Symptoms', type: 'multiselect', options: ['constipation', 'diarrhea (pea-soup)', 'abdominal pain', 'nausea', 'vomiting'] },
          { name: 'appetite', label: 'Appetite', type: 'select', options: ['markedly reduced', 'poor', 'fair', 'normal'] },
          { name: 'waterHistory', label: 'Water/Food History', type: 'select', options: ['Drinks untreated water', 'Drinks from communal source', 'Uses treated/boiled water', 'Recent exposure to contaminated food'] },
          { name: 'previousTreatment', label: 'Previous Treatment', type: 'select', options: ['No prior treatment', 'Took paracetamol only', 'Started antibiotics elsewhere', 'Completed antibiotic course but symptoms recurred'] },
        ]),
        defaultValues: JSON.stringify({
          duration: '1-week',
          feverCharacter: 'step-ladder pattern',
          appetite: 'poor'
        }),
        sortOrder: 2,
      },
    }),
    // URTI History Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'COUGH',
        templateName: 'Upper Respiratory Tract Infection History',
        template: 'Patient presents with {duration} history of {mainSymptoms}. The cough is {coughCharacter}. Patient also has {associatedSymptoms}. {allergicHistory}. {smokingHistory}. {previousTreatment}.',
        placeholders: JSON.stringify([
          { name: 'duration', label: 'Duration', type: 'select', options: ['1-day', '2-day', '3-day', '5-day', '1-week'], required: true },
          { name: 'mainSymptoms', label: 'Main Symptoms', type: 'multiselect', options: ['cough', 'sore throat', 'runny nose', 'nasal congestion', 'sneezing'], required: true },
          { name: 'coughCharacter', label: 'Cough Character', type: 'select', options: ['dry and non-productive', 'productive with clear sputum', 'productive with yellow sputum', 'productive with green sputum', 'with blood-stained sputum'] },
          { name: 'associatedSymptoms', label: 'Associated Symptoms', type: 'multiselect', options: ['fever', 'headache', 'body aches', 'ear pain', 'hoarseness', 'difficulty swallowing'] },
          { name: 'allergicHistory', label: 'Allergic History', type: 'select', options: ['No known allergies', 'History of allergic rhinitis', 'History of asthma', 'Seasonal allergies'] },
          { name: 'smokingHistory', label: 'Smoking History', type: 'select', options: ['Non-smoker', 'Ex-smoker', 'Current smoker', 'Passive smoke exposure'] },
          { name: 'previousTreatment', label: 'Previous Treatment', type: 'select', options: ['No treatment taken', 'Took cough syrup', 'Took paracetamol', 'Took antibiotics'] },
        ]),
        defaultValues: JSON.stringify({
          duration: '3-day',
          coughCharacter: 'dry and non-productive',
          allergicHistory: 'No known allergies',
          smokingHistory: 'Non-smoker'
        }),
        sortOrder: 3,
      },
    }),
    // UTI History Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'URINARY',
        templateName: 'Urinary Tract Infection History',
        template: 'Patient presents with {duration} history of {mainSymptoms}. The urine appears {urineCharacter}. {frequency}. {systemicSymptoms}. {riskFactors}. {previousUTI}.',
        placeholders: JSON.stringify([
          { name: 'duration', label: 'Duration', type: 'select', options: ['1-day', '2-day', '3-day', '5-day', '1-week'], required: true },
          { name: 'mainSymptoms', label: 'Main Symptoms', type: 'multiselect', options: ['burning on urination (dysuria)', 'frequent urination', 'urgency', 'suprapubic pain', 'lower back pain'], required: true },
          { name: 'urineCharacter', label: 'Urine Character', type: 'select', options: ['normal', 'cloudy', 'foul-smelling', 'blood-tinged', 'dark'] },
          { name: 'frequency', label: 'Frequency Pattern', type: 'select', options: ['Normal frequency', 'Increased day frequency', 'Increased night frequency (nocturia)', 'Both day and night frequency'] },
          { name: 'systemicSymptoms', label: 'Systemic Symptoms', type: 'multiselect', options: ['None', 'Fever', 'Chills', 'Nausea', 'Vomiting', 'Flank pain'] },
          { name: 'riskFactors', label: 'Risk Factors', type: 'multiselect', options: ['None identified', 'Sexually active', 'Recent catheterization', 'Diabetes', 'Pregnancy', 'Post-menopausal'] },
          { name: 'previousUTI', label: 'Previous UTI', type: 'select', options: ['No previous episodes', 'Recurrent UTIs (>3/year)', 'Previous UTI (treated)', 'Previous UTI (resistant)'] },
        ]),
        sortOrder: 4,
      },
    }),
    // Hypertension Follow-up Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'CHRONIC',
        templateName: 'Hypertension Follow-up',
        template: 'Known hypertensive patient on {currentMedications} presenting for routine follow-up. Patient reports {compliance}. {symptoms}. Diet is {dietCompliance}. Exercise is {exerciseCompliance}. {homeMonitoring}. No chest pain, shortness of breath, or visual changes.',
        placeholders: JSON.stringify([
          { name: 'currentMedications', label: 'Current Medications', type: 'text', required: true },
          { name: 'compliance', label: 'Compliance', type: 'select', options: ['good compliance with medications', 'occasionally misses doses', 'poor compliance', 'stopped medications'], required: true },
          { name: 'symptoms', label: 'Symptoms', type: 'multiselect', options: ['No symptoms', 'Headache', 'Dizziness', 'Palpitations', 'Fatigue', 'Leg swelling'] },
          { name: 'dietCompliance', label: 'Diet Compliance', type: 'select', options: ['low-salt diet maintained', 'trying to reduce salt', 'not following dietary advice'] },
          { name: 'exerciseCompliance', label: 'Exercise Compliance', type: 'select', options: ['regular (>3 times/week)', 'occasional', 'sedentary lifestyle'] },
          { name: 'homeMonitoring', label: 'Home Monitoring', type: 'select', options: ['Patient monitors BP at home - readings stable', 'Patient monitors BP - readings elevated', 'Does not monitor at home'] },
        ]),
        defaultValues: JSON.stringify({
          currentMedications: 'Amlodipine 5mg OD',
          compliance: 'good compliance with medications',
          symptoms: ['No symptoms']
        }),
        sortOrder: 5,
      },
    }),
    // Diabetes Follow-up Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'CHRONIC',
        templateName: 'Diabetes Follow-up',
        template: 'Known Type 2 diabetic on {currentMedications} presenting for routine follow-up. {compliance}. {glucoseMonitoring}. Patient reports {symptoms}. Diet is {dietCompliance}. {exerciseCompliance}. {complicationScreening}.',
        placeholders: JSON.stringify([
          { name: 'currentMedications', label: 'Current Medications', type: 'text', required: true },
          { name: 'compliance', label: 'Compliance', type: 'select', options: ['Good compliance with medications', 'Occasionally misses doses', 'Poor compliance', 'Stopped medications'] },
          { name: 'glucoseMonitoring', label: 'Glucose Monitoring', type: 'select', options: ['Regular home glucose monitoring - well controlled', 'Regular monitoring - poorly controlled', 'Occasional monitoring', 'No home monitoring'] },
          { name: 'symptoms', label: 'Symptoms', type: 'multiselect', options: ['No symptoms', 'Polyuria', 'Polydipsia', 'Weight loss', 'Fatigue', 'Blurred vision', 'Numbness in feet', 'Recurrent infections'] },
          { name: 'dietCompliance', label: 'Diet Compliance', type: 'select', options: ['following diabetic diet', 'trying to follow dietary advice', 'not following dietary advice'] },
          { name: 'exerciseCompliance', label: 'Exercise Compliance', type: 'select', options: ['Regular exercise (>3 times/week)', 'Occasional exercise', 'Sedentary lifestyle'] },
          { name: 'complicationScreening', label: 'Complications', type: 'select', options: ['No complications identified', 'Due for eye screening', 'Due for foot exam', 'Has known complications'] },
        ]),
        defaultValues: JSON.stringify({
          currentMedications: 'Metformin 500mg BD',
          compliance: 'Good compliance with medications',
          symptoms: ['No symptoms']
        }),
        sortOrder: 6,
      },
    }),
    // Gastritis Template
    prisma.clinicalTemplate.create({
      data: {
        templateType: 'HISTORY',
        category: 'ABDOMINAL',
        templateName: 'Gastritis/Dyspepsia History',
        template: 'Patient presents with {duration} history of {mainSymptoms}. Pain is {painCharacter}. {aggravatingFactors}. {relievingFactors}. {associatedSymptoms}. {riskFactors}. {alarmSymptoms}.',
        placeholders: JSON.stringify([
          { name: 'duration', label: 'Duration', type: 'select', options: ['Few days', '1-week', '2-weeks', '1-month', 'Chronic (>3 months)'], required: true },
          { name: 'mainSymptoms', label: 'Main Symptoms', type: 'multiselect', options: ['epigastric pain', 'burning sensation', 'bloating', 'early satiety', 'nausea'], required: true },
          { name: 'painCharacter', label: 'Pain Character', type: 'select', options: ['burning', 'gnawing', 'dull aching', 'crampy', 'sharp'] },
          { name: 'aggravatingFactors', label: 'Aggravating Factors', type: 'multiselect', options: ['Worse with food', 'Worse on empty stomach', 'Worse with spicy food', 'Worse lying down', 'Worse with NSAIDs'] },
          { name: 'relievingFactors', label: 'Relieving Factors', type: 'multiselect', options: ['Relieved by food', 'Relieved by antacids', 'Relieved by omeprazole', 'No relief with anything'] },
          { name: 'associatedSymptoms', label: 'Associated Symptoms', type: 'multiselect', options: ['None', 'Vomiting', 'Heartburn', 'Regurgitation', 'Loss of appetite'] },
          { name: 'riskFactors', label: 'Risk Factors', type: 'multiselect', options: ['None', 'NSAID use', 'Alcohol use', 'Smoking', 'H. pylori history', 'Stress'] },
          { name: 'alarmSymptoms', label: 'Alarm Symptoms', type: 'multiselect', options: ['None present', 'Weight loss', 'Blood in vomit', 'Black stools', 'Difficulty swallowing', 'Anemia'] },
        ]),
        sortOrder: 7,
      },
    }),
  ]);
  console.log(`✅ Created ${clinicalTemplates.length} clinical sentence builder templates\n`);

  // =====================
  // 12. CREATE EXAM TRIGGERS (Chief Complaint to Exam Section Mappings)
  // =====================
  console.log('🔗 Creating chief complaint to exam section mappings...');
  
  // Get exam section IDs
  const generalSection = examSections.find(s => s.sectionCode === 'GENERAL');
  const cvsSection = examSections.find(s => s.sectionCode === 'CVS');
  const respSection = examSections.find(s => s.sectionCode === 'RESP');
  const abdoSection = examSections.find(s => s.sectionCode === 'ABDO');
  const neuroSection = examSections.find(s => s.sectionCode === 'NEURO');
  const mskSection = examSections.find(s => s.sectionCode === 'MSK');
  const skinSection = examSections.find(s => s.sectionCode === 'SKIN');

  const examTriggers = await Promise.all([
    // Fever - triggers General, Abdominal, Neuro
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Fever', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Fever', examSectionId: abdoSection.id, priority: 2 },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Fever', examSectionId: neuroSection.id, priority: 2 },
    }),
    // Cough - triggers General, Respiratory, CVS
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Cough', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Cough', examSectionId: respSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Cough', examSectionId: cvsSection.id, priority: 2 },
    }),
    // Shortness of Breath - triggers Respiratory, CVS, General
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Shortness of Breath', examSectionId: respSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Shortness of Breath', examSectionId: cvsSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Shortness of Breath', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    // Abdominal Pain - triggers General, Abdominal
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Abdominal Pain', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Abdominal Pain', examSectionId: abdoSection.id, priority: 1, isRequired: true },
    }),
    // Chest Pain - triggers CVS, Respiratory, General
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Chest Pain', examSectionId: cvsSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Chest Pain', examSectionId: respSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Chest Pain', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    // Headache - triggers Neuro, CVS, General
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Headache', examSectionId: neuroSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Headache', examSectionId: cvsSection.id, priority: 2 },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Headache', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    // Joint Pain - triggers MSK, General
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Joint Pain', examSectionId: mskSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Joint Pain', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    // Rash - triggers Skin, General
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Rash', examSectionId: skinSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Rash', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    // Weakness - triggers Neuro, General, CVS
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Weakness', examSectionId: neuroSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Weakness', examSectionId: generalSection.id, priority: 1, isRequired: true },
    }),
    prisma.examTrigger.create({
      data: { chiefComplaint: 'Weakness', examSectionId: cvsSection.id, priority: 2 },
    }),
  ]);
  console.log(`✅ Created ${examTriggers.length} exam triggers\n`);

  // =====================
  // SUMMARY
  // =====================
  console.log('\n🎉 Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   • ${roles.length} roles`);
  console.log(`   • ${users.length} users`);
  console.log(`   • ${labTests.length} lab tests`);
  console.log(`   • ${drugs.length} drugs`);
  console.log(`   • ${drugRegimens.length} drug regimen templates`);
  console.log(`   • ${examSections.length} exam section templates`);
  console.log(`   • ${clinicalTemplates.length} clinical sentence builder templates`);
  console.log(`   • ${examTriggers.length} exam triggers`);
  console.log(`   • ${patients.length} patients`);
  console.log(`   • ${visits.length} visits`);
  console.log('\n👤 Test Users (all passwords: Admin123!):');
  console.log('   • admin (ADMIN)');
  console.log('   • frontdesk (FRONT_DESK)');
  console.log('   • nurse (NURSE)');
  console.log('   • doctor (DOCTOR)');
  console.log('   • pharmacist (PHARMACIST)');
  console.log('   • labtech (LAB_TECH)');
  console.log('   • billing (BILLING_CLERK)');
  console.log('\n✅ You can now login with any of these users!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
