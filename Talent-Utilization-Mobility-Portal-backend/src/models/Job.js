const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    department: {
      type: String,
      enum: ["ENG", "HR", "FIN", "MGMT", "DESIGN"],
      required: true,
    },
    employmentType: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    workMode: {
      type: String,
      enum: ["Remote", "Hybrid", "On-site"],
      default: "Hybrid",
    },
    location:       { type: String, trim: true },
    requiredSkills: [{ type: String, trim: true }],
    minExperience:  { type: Number, default: 0, min: 0 },
    jdText:         { type: String, required: true },
    postedBy:       { type: mongoose.Schema.Types.ObjectId, ref: "HRAdmin" },
    isActive:       { type: Boolean, default: true },
    matchStats: {
      fitCount:    { type: Number, default: 0 },
      unfitCount:  { type: Number, default: 0 },
      lastAnalyzed:{ type: Date },
    },
  },
  { timestamps: true }
);

// Index for fast department-filtered queries
JobSchema.index({ department: 1, isActive: 1 });

module.exports = mongoose.model("Job", JobSchema);
