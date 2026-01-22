const bcrypt = require('bcrypt');

Promise.all([
  bcrypt.hash('Admin@123', 10),
  bcrypt.hash('Hr@123', 10),
  bcrypt.hash('Employee@123', 10)
]).then(([admin, hr, employee]) => {
  console.log('\n=== Copy and run in Neon SQL Editor ===\n');
  console.log(`UPDATE employees SET password_hash = '${admin}' WHERE employee_id = 'EMP001';`);
  console.log(`UPDATE employees SET password_hash = '${hr}' WHERE employee_id = 'EMP002';`);
  console.log(`UPDATE employees SET password_hash = '${employee}' WHERE employee_id IN ('EMP003', 'EMP004', 'EMP005', 'EMP006', 'EMP007');`);
  console.log('\n=== Verification Query ===\n');
  console.log('SELECT employee_id, email FROM employees ORDER BY id;');
});
