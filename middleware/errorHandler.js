function errorHandler(error, req, res, next) {
  console.error('[ERROR]', {
    method: req.method,
    path: req.originalUrl,
    message: error.message,
    code: error.code
  });

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).send(
    'Ocurrió un error interno. Intenta nuevamente más tarde.'
  );
}

module.exports = errorHandler;