const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRE, JWT_RESET_EXPIRE } = require('../config/config');

/**
 * Generate JWT token
 */
const generateToken = (userId, expiresIn = JWT_EXPIRE) => {
  return jwt.sign({ id: userId }, JWT_SECRET, {
    expiresIn,
  });
};

/**
 * Generate reset password token
 */
const generateResetToken = (userId) => {
  return jwt.sign({ id: userId, type: 'reset' }, JWT_SECRET, {
    expiresIn: JWT_RESET_EXPIRE,
  });
};

/**
 * Verify reset token
 */
const verifyResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset') {
      throw new Error('Invalid token type');
    }
    return decoded;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  generateToken,
  generateResetToken,
  verifyResetToken,
};
