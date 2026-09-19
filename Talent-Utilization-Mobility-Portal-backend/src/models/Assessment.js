/**
 * Assessment.js — Shared model for Employee Assessments
 *
 * Bound to `adminConn` (shared with HR Admin).
 * Contains sensitive grading data (`correctAnswer`) which is stripped from JSON
 * automatically to prevent cheating.
 */

const mongoose = require('mongoose');

const { Schema } = mongoose;

const OptionSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema(
  {
    questionText: { type: String, required: true },
    options: [OptionSchema],
    correctAnswer: { type: String, required: true, select: false }, // Crucial: select: false hides it by default
  },
  { _id: false }
);

const SubmittedAnswerSchema = new Schema(
  {
    questionIndex: { type: Number, required: true },
    selectedAnswer: { type: String, required: true },
  },
  { _id: false }
);

const AssessmentSchema = new Schema(
  {
    // ── References ─────────────────────────────────────────────────────────────
    employeeId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },

    // ── Schedule details ───────────────────────────────────────────────────────
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 30 },
    status: {
      type: String,
      enum: ['upcoming', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    // ── Content ────────────────────────────────────────────────────────────────
    questions: [QuestionSchema],

    // ── Employee Submission ────────────────────────────────────────────────────
    submittedAnswers: [SubmittedAnswerSchema],
    submittedAt: { type: Date },

    // ── Grading & AI Feedback ──────────────────────────────────────────────────
    score: { type: Number },
    percentage: { type: Number },
    aiSummary: { type: String },

    // ── HR Decision ────────────────────────────────────────────────────────────
    hrAction: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    hrFeedback: { type: String },
  },
  {
    timestamps: true,
    strict: false, // Tolerate HR schema variations
  }
);

// ── Security Transform ─────────────────────────────────────────────────────────
AssessmentSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.__v;
    // Extra safety measure: remove correctAnswer from JSON entirely
    if (ret.questions) {
      ret.questions.forEach(q => delete q.correctAnswer);
    }
    return ret;
  },
});

// ── Lazy model getter ───────────────────────────────────────────────────────────────
// Returns the Mongoose model after connectDatabases() has been called.
// Call getAssessment() in controllers/routes to get the live model.

let _Assessment = null;

function getAssessment() {
  if (!_Assessment) {
    const { adminConn } = require('../config/db');
    _Assessment = adminConn.model('Assessment', AssessmentSchema);
  }
  return _Assessment;
}

module.exports = { getAssessment, AssessmentSchema };
