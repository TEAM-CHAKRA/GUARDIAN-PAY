export function sendSuccess(res, data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    ...data,
  });
}

export function sendError(res, { code, message, details = {} }, status = 400) {
  return res.status(status).json({
    success: false,
    error: {
      code: code || 'INTERNAL_ERROR',
      message: message || 'An unexpected error occurred.',
      details: details && typeof details === 'object' ? details : {},
    },
  });
}
