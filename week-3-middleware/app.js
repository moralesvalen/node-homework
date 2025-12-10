const express = require("express");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const dogsRouter = require("./routes/dogs");

const app = express();
const {
  ValidationError,
  NotFoundError,
  UnauthorizedError,
} = require("./errors");

// Your middleware here
//Request ID Middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

//Logging Middleware

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

//security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

//jason parsing middleware
app.use(express.json({ limit: "1kb" }));

//Content-Type Validation Middleware
app.use((req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.headers["content-type"];

    if (!contentType || !contentType.includes("application/json")) {
      return next(new ValidationError("Content-Type must be application/json"));
    }
  }
  next();
});

//static images middleware
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use("/", dogsRouter); // Do not remove this line

//error handling middleware
// Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // Logging required by Task 4
  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name || "Error"} ${err.message}`);
  }

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    requestId: req.requestId,
  });
});

//404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

const server = app.listen(3000, () =>
  console.log("Server listening on port 3000")
);
module.exports = server;
