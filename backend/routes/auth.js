const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

// Mock user database (in production, use actual database)
const users = [
  {
    id: "1",
    email: "demo@alphainsure.com",
    password: "$2a$10$YourHashedPasswordHere", // 'demo123'
    name: "Demo User",
    roles: ["user"],
    company: "AlphaInsure Demo",
  },
  {
    id: "2",
    email: "admin@alphainsure.com",
    password: "$2a$10$YourHashedPasswordHere", // 'admin123'
    name: "Admin User",
    roles: ["admin", "user"],
    company: "AlphaInsure",
  },
];

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user (in production, query database)
    const user = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // For demo purposes, accept any password
    // In production, verify with bcrypt
    // const isValidPassword = await bcrypt.compare(password, user.password);
    const isValidPassword = true; // Demo mode

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        roles: user.roles,
      },
      process.env.JWT_SECRET || "demo_secret_key",
      { expiresIn: "24h" }
    );

    // Return user data (exclude password)
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles,
      company: user.company,
    };

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user (demo only)
 * @access  Public
 */
router.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, company } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    // Check if user already exists
    const existingUser = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    // Hash password (in demo, we'll skip this)
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      email: email.toLowerCase(),
      password: "$2a$10$DemoHashedPassword",
      name,
      roles: ["user"],
      company: company || "Demo Company",
    };

    // Add to users array (in production, save to database)
    users.push(newUser);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email,
        roles: newUser.roles,
      },
      process.env.JWT_SECRET || "demo_secret_key",
      { expiresIn: "24h" }
    );

    // Return user data (exclude password)
    const userResponse = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      roles: newUser.roles,
      company: newUser.company,
    };

    logger.info(`New user registered: ${newUser.email}`);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        token,
      },
      message: "Registration successful",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", (req, res) => {
  // In a real application, you might want to blacklist the token
  // For demo purposes, we'll just return success

  logger.info(`User logged out: ${req.user?.email || "unknown"}`);

  res.json({
    success: true,
    message: "Logout successful",
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get("/me", (req, res) => {
  // This route requires authentication middleware
  // The user data will be attached to req.user by the auth middleware

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated",
    });
  }

  // Find full user data
  const user = users.find((u) => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Return user data (exclude password)
  const userResponse = {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
    company: user.company,
  };

  res.json({
    success: true,
    data: userResponse,
  });
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put("/profile", async (req, res, next) => {
  try {
    const { name, company } = req.body;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    // Find and update user
    const userIndex = users.findIndex((u) => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update user data
    if (name) users[userIndex].name = name;
    if (company) users[userIndex].company = company;

    const updatedUser = {
      id: users[userIndex].id,
      email: users[userIndex].email,
      name: users[userIndex].name,
      roles: users[userIndex].roles,
      company: users[userIndex].company,
    };

    logger.info(`Profile updated for user: ${users[userIndex].email}`);

    res.json({
      success: true,
      data: updatedUser,
      message: "Profile updated successfully",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
