import app from "./app.js";
import config from "./config/config.js";
import prisma from "./config/database.js";

let server: ReturnType<typeof app.listen>;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log("Database connected successfully");

    server = app.listen(config.PORT, () => {
      console.log(`Server is running on port ${config.PORT}`);
      console.log(`API URL: http://localhost:${config.PORT}/api/v1`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

// Process Error Handlers
process.on("uncaughtException", (err: Error) => {
  console.error("UNCAUGHT EXCEPTION! Shutting down...");
  console.error(err.name, err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("UNHANDLED REJECTION! Shutting down...");
  console.error(reason);

  if (server) {
    server.close(async () => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log("Server and database disconnected");
      process.exit(0);
    });
  } else {
    await prisma.$disconnect();
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();
