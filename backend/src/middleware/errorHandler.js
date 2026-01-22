/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Log error stack in development
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // PostgreSQL duplicate key error
  if (err.code === '23505') {
    const field = err.detail?.match(/Key \((.*?)\)/)?.[1] || 'field';
    error.message = `${field} already exists`;
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // PostgreSQL foreign key error
  if (err.code === '23503') {
    error.message = 'Referenced record not found';
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // PostgreSQL not null violation
  if (err.code === '23502') {
    const field = err.column || 'field';
    error.message = `${field} is required`;
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    return res.status(401).json({
      success: false,
      message: error.message,
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
