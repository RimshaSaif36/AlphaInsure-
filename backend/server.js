const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Add error handling for uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

try {
  // Import routes with error handling
  const riskRoutes = require("./routes/risk");
  const claimsRoutes = require("./routes/claims");
  const satelliteRoutes = require("./routes/satellite");
  const monitoringRoutes = require("./routes/monitoring");
  const authRoutes = require("./routes/auth");

  // Import middleware
  const { authMiddleware } = require("./middleware/auth");
  const errorHandler = require("./middleware/errorHandler");
  const logger = require("./utils/logger");

  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: "Too many requests from this IP, please try again later.",
  });

  // Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      credentials: true,
    })
  );
  app.use(morgan("combined"));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  app.use(limiter);

  // Database connection
  if (
    process.env.MONGODB_URI &&
    process.env.MONGODB_URI !== "mongodb://localhost:27017/alphainsure"
  ) {
    // Only connect to MongoDB if a custom URI is provided
    mongoose
      .connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => logger.info("Connected to MongoDB"))
      .catch((err) => logger.error("MongoDB connection error:", err));
  } else {
    // Skip MongoDB in demo mode
    logger.info("MongoDB connection skipped - running in demo mode");
  }

  // Socket.io for real-time updates
  io.on("connection", (socket) => {
    logger.info("Client connected:", socket.id);

    socket.on("joinRoom", (room) => {
      socket.join(room);
      logger.info(`Client ${socket.id} joined room ${room}`);
    });

    socket.on("disconnect", () => {
      logger.info("Client disconnected:", socket.id);
    });
  });

  // Make io available to routes
  app.set("io", io);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  });

  // API routes
  app.use("/api/auth", authRoutes);

  // If DEMO_MODE is enabled we allow unauthenticated access to risk, satellite, monitoring, and claims endpoints
  if (process.env.DEMO_MODE === "true") {
    app.use("/api/risk", riskRoutes);
    app.use("/api/satellite", satelliteRoutes);
    app.use("/api/monitoring", monitoringRoutes);
    app.use("/api/claims", claimsRoutes);
  } else {
    app.use("/api/risk", authMiddleware, riskRoutes);
    app.use("/api/satellite", authMiddleware, satelliteRoutes);
    app.use("/api/monitoring", authMiddleware, monitoringRoutes);
    app.use("/api/claims", authMiddleware, claimsRoutes);
  }

  // Error handling
  app.use(errorHandler);

  // Start server
  const PORT = process.env.PORT || 3001;
  server.listen(PORT, () => {
    logger.info(`AlphaInsure Backend Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  });

  module.exports = app;
} catch (error) {
  console.error("Error starting server:", error);
  process.exit(1);
}
