const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validationMiddleware");
const protect = require("../middleware/authMiddleware");


const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  startGoogleAuth,
  googleAuthCallback,
} = require("../controllers/authController");


const router = express.Router();

// ✅ Register validation
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 chars"),
  ],
  validate,
  registerUser
);

// ✅ Login validation
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  validate,
  loginUser
);

// 👤 Get current user
router.get("/me", protect, getCurrentUser);

// 🚪 Logout
router.post("/logout", protect, logoutUser);
router.get("/google", startGoogleAuth);
router.get("/google/callback", googleAuthCallback);

module.exports = router;
