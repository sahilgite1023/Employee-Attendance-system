/**
 * Script to fix attendance records with missing status
 * This will update all records that have NULL status based on check-in time and hours worked
 */

require('dotenv').config();
const db = require('./src/config/database');
const { CHECK_IN_START_TIME, LATE_THRESHOLD_MINUTES, HALF_DAY_HOURS, FULL_DAY_HOURS } = require('./src/config/config');

const parseTimeString = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
};

const calculateMinutes = (startTime, endTime) => {
  return Math.floor((endTime - startTime) / (1000 * 60));
};

async function fixAttendanceStatus() {
  try {
    console.log('🔍 Finding attendance records with missing status...\n');

    // Get all attendance records with NULL status
    const records = await db.query(
      `SELECT * FROM attendance WHERE status IS NULL ORDER BY attendance_date DESC`
    );

    if (records.rows.length === 0) {
      console.log('✓ No records found with missing status!');
      process.exit(0);
    }

    console.log(`Found ${records.rows.length} records with missing status:\n`);

    let updatedCount = 0;

    for (const record of records.rows) {
      const checkInTime = new Date(record.check_in_time);
      const attendanceDate = record.attendance_date;

      // Calculate if late
      const startTime = parseTimeString(CHECK_IN_START_TIME);
      const thresholdTime = new Date(checkInTime);
      thresholdTime.setHours(startTime.hours, startTime.minutes, 0, 0);

      const isLate = checkInTime > thresholdTime;
      const lateByMinutes = isLate ? calculateMinutes(thresholdTime, checkInTime) : 0;

      let status = 'present';
      
      // Determine status based on check-in time
      if (isLate && lateByMinutes > LATE_THRESHOLD_MINUTES) {
        status = 'late';
      }

      // If checked out, adjust status based on hours worked
      if (record.check_out_time && record.total_hours) {
        const totalHours = parseFloat(record.total_hours);
        if (totalHours < HALF_DAY_HOURS) {
          status = 'half-day';
        } else if (totalHours >= FULL_DAY_HOURS && status !== 'late') {
          status = 'present';
        }
      }

      // Update the record
      await db.query(
        `UPDATE attendance 
         SET status = $1, is_late = $2, late_by_minutes = $3
         WHERE id = $4`,
        [status, isLate, lateByMinutes, record.id]
      );

      console.log(`✓ Updated Record ID ${record.id}:`);
      console.log(`  Date: ${attendanceDate}`);
      console.log(`  Check-in: ${checkInTime.toLocaleTimeString()}`);
      console.log(`  Status: ${status} ${isLate ? `(Late by ${lateByMinutes} mins)` : ''}`);
      console.log(`  Total Hours: ${record.total_hours || 'Not checked out yet'}\n`);

      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} attendance records!`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing attendance status:', error);
    process.exit(1);
  }
}

// Run the script
fixAttendanceStatus();
