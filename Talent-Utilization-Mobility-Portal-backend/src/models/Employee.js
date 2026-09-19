/**
 * Employee.js — Mongoose schema for employee documents.
 *
 * Bound to the EMPLOYEE connection so it stays isolated from the shared
 * HR (admin) database. All sub-schemas are designed to be progressively
 * populated across later phases (resume upload, profile editing, etc.).
 *
 * Password is NEVER returned by default — see the toJSON transform below.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { employeeConn } = require('../config/db');

const { Schema } = mongoose;

// ── Sub-schemas ────────────────────────────────────────────────────────────────

const SkillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate',
    },
    yearsOfExperience: { type: Number, min: 0, default: 0 },
    endorsements: { type: Number, default: 0 },
  },
  { _id: false }
);

const ExperienceSchema = new Schema(
  {
    title: { type: String, trim: true },
    company: { type: String, trim: true },
    location: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date }, // null = current role
    isCurrent: { type: Boolean, default: false },
    description: { type: String, trim: true },
    technologiesUsed: [{ type: String, trim: true }],
  },
  { _id: false }
);

const EducationSchema = new Schema(
  {
    institution: { type: String, trim: true },
    degree: { type: String, trim: true },
    fieldOfStudy: { type: String, trim: true },
    startYear: { type: Number },
    endYear: { type: Number },
    grade: { type: String, trim: true },
  },
  { _id: false }
);

const CertificationSchema = new Schema(
  {
    name: { type: String, trim: true },
    issuingOrganisation: { type: String, trim: true },
    issueDate: { type: Date },
    expiryDate: { type: Date },
    credentialId: { type: String, trim: true },
    credentialUrl: { type: String, trim: true },
  },
  { _id: false }
);

const ProjectSchema = new Schema(
  {
    title: { type: String, trim: true },
    description: { type: String, trim: true },
    technologiesUsed: [{ type: String, trim: true }],
    repoUrl: { type: String, trim: true },
    liveUrl: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  { _id: false }
);

// ── Root schema ────────────────────────────────────────────────────────────────

const EmployeeSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name must not exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never returned in queries by default
    },

    // ── Role & department ─────────────────────────────────────────────────────
    role: {
      type: String,
      enum: ['employee', 'admin', 'hr'],
      default: 'employee',
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
      uppercase: true,
    },
    designation: { type: String, trim: true },
    joiningDate: { type: Date },

    // ── Contact ───────────────────────────────────────────────────────────────
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    linkedinUrl: { type: String, trim: true },
    githubUrl: { type: String, trim: true },
    portfolioUrl: { type: String, trim: true },

    // ── Profile media ─────────────────────────────────────────────────────────
    profilePhotoUrl: { type: String, trim: true },
    resumeUrl: { type: String, trim: true },       // Cloudinary URL
    resumePublicId: { type: String, trim: true },  // Cloudinary public_id

    // ── Profile content sub-schemas ───────────────────────────────────────────
    skills: [SkillSchema],
    experience: [ExperienceSchema],
    education: [EducationSchema],
    certifications: [CertificationSchema],
    projects: [ProjectSchema],
    summary: { type: String, trim: true, maxlength: 1000 },

    // ── Profile completeness (0–100, updated programmatically) ────────────────
    profileComplete: { type: Number, default: 10, min: 0, max: 100 },

    // ── Pinecone indexing state (Phase 2+) ────────────────────────────────────
    isIndexed: { type: Boolean, default: false },
    lastIndexedAt: { type: Date },

    // ── Soft delete / account state ───────────────────────────────────────────
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true, // createdAt, updatedAt
    collection: 'employees',
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────────

// (email and employeeId are already unique in the schema definition)
EmployeeSchema.index({ department: 1 });

// ── Pre-save hook: hash password on create / change ────────────────────────────

EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Instance method: compare plain-text password against the stored hash ───────

EmployeeSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ── toJSON transform: strip the password field from serialised output ──────────

EmployeeSchema.set('toJSON', {
  virtuals: true,
  transform(doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// ── Bind model to the employee-specific connection ─────────────────────────────

const Employee = employeeConn.model('Employee', EmployeeSchema);

module.exports = Employee;
