const morgan = require("morgan");

// Custom token: response body
morgan.token("body", (req) => JSON.stringify(req.body));

const requestLogger = morgan(
  ":method :url :status :response-time ms - body: :body",
  {
    stream: {
      write: (message) => console.log("[HTTP]", message.trim())
    }
  }
);

// Simple response logger middleware
function responseLogger(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    console.log("[RESPONSE]", req.method, req.originalUrl, "->", JSON.stringify(data).slice(0, 200));
    return originalJson(data);
  };
  next();
}

module.exports = { requestLogger, responseLogger };
