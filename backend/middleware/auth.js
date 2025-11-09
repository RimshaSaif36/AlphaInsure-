const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: "Access denied. No token provided.",
        code: "NO_TOKEN",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    logger.info(
      `Authenticated user: ${decoded.userId} for ${req.method} ${req.path}`
    );
    next();
  } catch (error) {
    logger.warn(`Authentication failed: ${error.message}`);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token.",
        code: "INVALID_TOKEN",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired.",
        code: "TOKEN_EXPIRED",
      });
    }

    res.status(401).json({
      error: "Authentication failed.",
      code: "AUTH_FAILED",
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Admin authorization middleware
const adminAuth = async (req, res, next) => {
  if (!req.user || !req.user.roles.includes("admin")) {
    logger.warn(`Admin access denied for user: ${req.user?.userId}`);
    return res.status(403).json({
      error: "Access denied. Admin privileges required.",
      code: "ADMIN_REQUIRED",
    });
  }

  next();
};

module.exports = {
  authMiddleware,
  optionalAuth,
  adminAuth,
};
