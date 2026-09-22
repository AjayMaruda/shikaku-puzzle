function notFound(req, res, next) {
  const err = new Error(`Not Found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
}

module.exports = { errorHandler, notFound };
