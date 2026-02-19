const express = require("express");
const { body } = require("express-validator");

const protect = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");

const {
  createJob,
  extractJobFromLink,
  getJobs,
  getLocationSuggestions,
  updateJob,
  deleteJob,
  applyToJob,
  getJobStats,
  getJobById,
} = require("../controllers/jobController");

const router = express.Router();

// 🔐 protect all routes
router.use(protect);

// 📊 stats route (must be before "/")
router.get("/stats", getJobStats);
router.get("/locations/suggest", getLocationSuggestions);
router.post(
  "/extract-from-link",
  [body("jobLink").isURL().withMessage("Valid job link required")],
  validate,
  extractJobFromLink
);

// ➕ create job (with validation)
router.post(
  "/",
  [
    body("companyName").notEmpty().withMessage("Company name required"),
    body("role").notEmpty().withMessage("Role required"),
    body("status")
      .optional()
      .isIn(["Saved", "Applied", "Interview", "Rejected", "Offer"])
      .withMessage("Invalid status"),
  ],
  validate,
  createJob
);

// 📋 get jobs
router.get("/", getJobs);

// 🚀 smart apply
router.post("/:id/apply", applyToJob);

// 🔎 get single job
router.get("/:id", getJobById);

// ✏️ update job
router.put(
  "/:id",
  [
    body("companyName")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Company name cannot be empty"),
    body("role")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Role cannot be empty"),
    body("status")
      .optional()
      .isIn(["Saved", "Applied", "Interview", "Rejected", "Offer"])
      .withMessage("Invalid status"),
  ],
  validate,
  updateJob
);

// ❌ delete job
router.delete("/:id", deleteJob);

module.exports = router;
