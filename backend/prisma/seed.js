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
        expiryDate: new Date('2026-12-31'),
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
        expiryDate: new Date('2026-08-31'),
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
        expiryDate: new Date('2026-06-30'),
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
        expiryDate: new Date('2027-03-31'),
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
        expiryDate: new Date('2026-10-31'),
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
  // SUMMARY
  // =====================
  console.log('\n🎉 Database seeding completed!\n');
  console.log('📊 Summary:');
  console.log(`   • ${roles.length} roles`);
  console.log(`   • ${users.length} users`);
  console.log(`   • ${labTests.length} lab tests`);
  console.log(`   • ${drugs.length} drugs`);
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
