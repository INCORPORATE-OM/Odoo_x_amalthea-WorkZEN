import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create default admin user
  const adminEmail = 'admin@workzen.com';
  const adminPassword = 'Admin@123';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin user already exists');
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: '+1234567890',
        department: 'Administration',
        designation: 'System Administrator',
      },
    });

    console.log('✅ Created admin user:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      password: adminPassword, // Only for initial setup
    });
  }

  // Create sample HR officer
  const hrEmail = 'hr@workzen.com';
  const hrPassword = 'HR@123';

  const existingHR = await prisma.user.findUnique({
    where: { email: hrEmail },
  });

  if (existingHR) {
    console.log('✅ HR officer already exists');
  } else {
    const hashedPassword = await bcrypt.hash(hrPassword, 10);

    const hr = await prisma.user.create({
      data: {
        name: 'HR Officer',
        email: hrEmail,
        password: hashedPassword,
        role: 'hr_officer',
        phone: '+1234567891',
        department: 'Human Resources',
        designation: 'HR Officer',
      },
    });

    console.log('✅ Created HR officer:', {
      id: hr.id,
      email: hr.email,
      role: hr.role,
      password: hrPassword,
    });
  }

  // Create sample Payroll officer
  const payrollEmail = 'payroll@workzen.com';
  const payrollPassword = 'Payroll@123';

  const existingPayroll = await prisma.user.findUnique({
    where: { email: payrollEmail },
  });

  if (existingPayroll) {
    console.log('✅ Payroll officer already exists');
  } else {
    const hashedPassword = await bcrypt.hash(payrollPassword, 10);

    const payroll = await prisma.user.create({
      data: {
        name: 'Payroll Officer',
        email: payrollEmail,
        password: hashedPassword,
        role: 'payroll_officer',
        phone: '+1234567892',
        department: 'Finance',
        designation: 'Payroll Officer',
      },
    });

    console.log('✅ Created Payroll officer:', {
      id: payroll.id,
      email: payroll.email,
      role: payroll.role,
      password: payrollPassword,
    });
  }

  // Create sample employee
  const employeeEmail = 'employee@workzen.com';
  const employeePassword = 'Employee@123';

  const existingEmployee = await prisma.user.findUnique({
    where: { email: employeeEmail },
  });

  if (existingEmployee) {
    console.log('✅ Sample employee already exists');
  } else {
    const hashedPassword = await bcrypt.hash(employeePassword, 10);

    const employee = await prisma.user.create({
      data: {
        name: 'Sample Employee',
        email: employeeEmail,
        password: hashedPassword,
        role: 'employee',
        phone: '+1234567893',
        department: 'Engineering',
        designation: 'Software Developer',
      },
    });

    console.log('✅ Created sample employee:', {
      id: employee.id,
      email: employee.email,
      role: employee.role,
      password: employeePassword,
    });
  }

  console.log('\n📝 Default credentials:');
  console.log('Admin: admin@workzen.com / Admin@123');
  console.log('HR: hr@workzen.com / HR@123');
  console.log('Payroll: payroll@workzen.com / Payroll@123');
  console.log('Employee: employee@workzen.com / Employee@123');
  console.log('\n✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

