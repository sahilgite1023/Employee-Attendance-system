/**
 * Format time to HH:MM
 */
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Calculate hours between two timestamps
 */
const calculateHours = (checkInTime, checkOutTime) => {
  if (!checkInTime || !checkOutTime) return 0;
  
  const diff = new Date(checkOutTime) - new Date(checkInTime);
  return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Round to 2 decimals
};

/**
 * Calculate minutes difference
 */
const calculateMinutes = (time1, time2) => {
  const diff = new Date(time2) - new Date(time1);
  return Math.floor(diff / (1000 * 60));
};

/**
 * Check if time is late
 */
const isLate = (checkInTime, lateThreshold) => {
  const checkIn = new Date(checkInTime);
  const threshold = new Date(checkInTime);
  
  // Parse threshold time (e.g., "09:30")
  const [hours, minutes] = lateThreshold.split(':');
  threshold.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  return checkIn > threshold;
};

/**
 * Get time from time string (HH:MM)
 */
const parseTimeString = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Check if date is weekend
 */
const isWeekend = (date) => {
  const day = new Date(date).getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Calculate business days between dates
 */
const calculateBusinessDays = (startDate, endDate) => {
  let count = 0;
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    if (!isWeekend(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return count;
};

/**
 * Get date range for filters
 */
const getDateRange = (period) => {
  const today = new Date();
  let startDate, endDate;
  
  switch (period) {
    case 'today':
      startDate = endDate = formatDate(today);
      break;
    case 'week':
      startDate = new Date(today.setDate(today.getDate() - 7));
      endDate = new Date();
      break;
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date();
      break;
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date();
      break;
    default:
      startDate = endDate = formatDate(new Date());
  }
  
  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
};

/**
 * Get greeting based on time
 */
const getGreeting = () => {
  const hour = new Date().getHours();
  
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Generate employee ID
 */
const generateEmployeeId = (lastId) => {
  const num = lastId ? parseInt(lastId.replace('EMP', '')) + 1 : 1;
  return `EMP${num.toString().padStart(3, '0')}`;
};

module.exports = {
  formatTime,
  formatDate,
  calculateHours,
  calculateMinutes,
  isLate,
  parseTimeString,
  isWeekend,
  calculateBusinessDays,
  getDateRange,
  getGreeting,
  generateEmployeeId,
};
