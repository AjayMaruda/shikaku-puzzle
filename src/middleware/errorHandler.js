function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  console.error("[ERROR]", req.method, req.originalUrl, status, message);
  res.status(status).json({ success: false, error: message });
}

function notFound(req, res, next) {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
}

module.exports = { errorHandler, notFound };
