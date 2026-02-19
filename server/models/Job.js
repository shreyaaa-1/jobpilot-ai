const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Saved", "Applied", "Interview", "Rejected", "Offer"],
      default: "Saved", // ✅ FIXED (important)
    },

    jobLink: {
      type: String,
      trim: true,
    },

    notes: String,

    requiredSkills: [String],

    responsibilities: [String],

    qualifications: [String],

    resumeText: {
      type: String,
      default: "",
    },

    resumeFileName: {
      type: String,
      default: "",
    },

    lastMatchScore: {
      type: Number,
      default: null,
    },

    location: String,

    // ✅ salary can be null (for freshers)
    salary_min: {
      type: Number,
      default: null,
    },

    salary_max: {
      type: Number,
      default: null,
    },

    appliedDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 performance index
jobSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Job", jobSchema);
