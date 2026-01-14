//const pool = require("./db/pg-pool");
const prisma = require("./db/prisma");
const express = require("express");
const app = express();

global.user_id = null;
global.users = [];
global.tasks = [];

// Limitar el tamaño del cuerpo de las solicitudes a 1kb
app.use(express.json({ limit: "1kb" }));

app.use((req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Query:", req.query);

  next();
});

// Middleware de logging
const requestLogger = require("./middleware/requestLogger");
app.use(requestLogger);

// Middleware de autenticación
const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", authMiddleware, taskRouter);

// RUTA PRINCIPAL
app.get("/", (req, res) => {
  res.json({ message: "Hello, World!" });
});

// RUTA DE PRUEBA POST
app.post("/testpost", (req, res) => {
  res.json({ message: "POST received." });
});

//Health check

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({
      status: "error",
      db: "not connected",
      error: err.message,
    });
  }
});

// Route users registration

const userRouter = require("./routes/userRoutes");
app.use("/api/users", userRouter);

// MIDDLEWARE 404
const notFound = require("./middleware/not-found");
app.use(notFound);

// MIDDLEWARE ERROR HANDLER
const errorHandler = require("./middleware/error-handler");
app.use(errorHandler);

// SERVIDOR
const port = process.env.PORT || 3000;
const server = app.listen(port, () =>
  console.log(
    `Server is listening on port ${port}... visit http://localhost:${port}`
  )
);

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use.`);
  } else {
    console.error("Server error:", err);
  }
  process.exit(1);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed.");
/*
    await pool.end();
    console.log("Database pool closed.");*/

    await prisma.$disconnect();
    console.log("Prisma disconnected.");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    console.log("Exiting process...");
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0)); // ctrl+c
process.on("SIGTERM", () => shutdown(0)); // e.g. `docker stop`
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  shutdown(1);
});

module.exports = { app, server };
