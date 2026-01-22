const db = require('./src/config/database');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    console.log('Creating admin account...\n');

    // User details
    const employeeId = 'sahilgite511';
    const password = 'sahilgite@2003';
    const email = 'sahilgite@gmail.com';
    const firstName = 'Sahil';
    const lastName = 'Gite';

    // Generate password hash
    console.log('Generating password hash...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    console.log('✓ Password hash generated\n');

    // Get admin role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', ['admin']);
    if (roleResult.rows.length === 0) {
      throw new Error('Admin role not found in database');
    }
    const adminRoleId = roleResult.rows[0].id;

    // Insert admin user
    console.log('Inserting admin user into database...');
    const result = await db.query(
      `INSERT INTO employees (
        employee_id, email, password_hash, first_name, last_name,
        designation, department, role_id, date_of_joining, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id, employee_id, email, first_name, last_name, designation, department`,
      [
        employeeId,
        email,
        passwordHash,
        firstName,
        lastName,
        'System Administrator',
        'IT',
        adminRoleId,
        new Date(),
        true
      ]
    );

    const admin = result.rows[0];

    console.log('═══════════════════════════════════════');
    console.log('✅ Admin account created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nAccount Details:');
    console.log(`Employee ID: ${admin.employee_id}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Name: ${admin.first_name} ${admin.last_name}`);
    console.log(`Designation: ${admin.designation}`);
    console.log(`Department: ${admin.department}`);
    console.log('\nLogin Credentials:');
    console.log(`Username: ${employeeId}`);
    console.log(`Password: ${password}`);
    console.log('\nYou can now login at: http://localhost:3001/login\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    if (error.code === '23505') {
      console.error('\n⚠️  An account with this employee ID or email already exists.');
    }
    process.exit(1);
  }
}

createAdmin();
