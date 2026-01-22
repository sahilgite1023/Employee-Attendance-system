const db = require('./src/config/database');

async function clearDatabase() {
  try {
    console.log('🗑️  Starting database cleanup...\n');

    // Delete in order to respect foreign key constraints
    
    console.log('Deleting audit logs...');
    const auditResult = await db.query('DELETE FROM audit_logs');
    console.log(`✓ Deleted ${auditResult.rowCount} audit log entries\n`);

    console.log('Deleting leave requests...');
    const leaveResult = await db.query('DELETE FROM leave_requests');
    console.log(`✓ Deleted ${leaveResult.rowCount} leave requests\n`);

    console.log('Deleting attendance records...');
    const attendanceResult = await db.query('DELETE FROM attendance');
    console.log(`✓ Deleted ${attendanceResult.rowCount} attendance records\n`);

    console.log('Deleting all employees...');
    const employeeResult = await db.query('DELETE FROM employees');
    console.log(`✓ Deleted ${employeeResult.rowCount} employees\n`);

    console.log('═══════════════════════════════════════');
    console.log('✅ Database cleared successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nAll user accounts and data have been removed.');
    console.log('The roles table has been preserved.');
    console.log('\nYou can now create new accounts as needed.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
}

clearDatabase();
