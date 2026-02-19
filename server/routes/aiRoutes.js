const express = require("express");
const multer = require("multer");
const protect = require("../middleware/authMiddleware");
const { getMatchScore, getMatchScoreFromUpload } = require("../controllers/aiController");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

router.use(protect);
router.post("/match-score", getMatchScore);
router.post("/match-score/upload", upload.single("resumeFile"), getMatchScoreFromUpload);

module.exports = router;
