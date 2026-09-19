const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const QuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      A: { type: String, required: true },
      B: { type: String, required: true },
      C: { type: String, required: true },
      D: { type: String, required: true },
    },
    correctAnswer: { type: String, enum: ["A", "B", "C", "D"], required: true },
  },
  { _id: false }
);

const AnswerSchema = new mongoose.Schema(
  {
    questionIndex:  { type: Number, required: true },
    selectedAnswer: { type: String, enum: ["A", "B", "C", "D"] },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const AssessmentSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    scheduledDate: { type: Date,   required: true },
    scheduledTime: { type: String, required: true },  // e.g. "10:00 AM"
    duration:      { type: Number, default: 30 },     // minutes

    status: {
      type: String,
      enum: ["upcoming", "in-progress", "completed", "cancelled"],
      default: "upcoming",
    },

    questions: [QuestionSchema],

    // ── Filled when employee submits ─────────────────────────────────────────
    submittedAnswers: [AnswerSchema],
    score:      { type: Number },   // correct answers count out of 30
    percentage: { type: Number },   // 0–100
    aiSummary:  { type: String },   // 3-sentence AI performance summary

    // ── HR decision ──────────────────────────────────────────────────────────
    hrAction: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    hrFeedback: { type: String, default: "" },

    notifiedEmployee: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes for common query patterns
AssessmentSchema.index({ employeeId: 1, status: 1 });
AssessmentSchema.index({ jobId: 1, status: 1 });
AssessmentSchema.index({ hrAction: 1 });

module.exports = mongoose.model("Assessment", AssessmentSchema);
