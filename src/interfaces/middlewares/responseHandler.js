export const sendResponse = (
  res,
  statusCode,
  message,
  data = null,
  success,
  errors = null
) => {
  if (typeof success === 'undefined') {
    success = statusCode >= 200 && statusCode < 300;
  }

  return res.status(statusCode).json({
    success,
    statusCode,
    message,
    data,
    errors,
  });
};


