const mongoose = require("mongoose");

// ── Sub-schemas ───────────────────────────────────────────────────────────────

const SkillSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    proficiency: { type: String, enum: ["Beginner", "Intermediate", "Expert"], default: "Intermediate" },
  },
  { _id: false }
);

const ExperienceSchema = new mongoose.Schema(
  {
    company:          { type: String, trim: true },
    jobTitle:         { type: String, trim: true },
    duration:         { type: String },          // e.g. "Jan 2020 – Mar 2022"
    responsibilities: { type: String },
    technologiesUsed: [String],
    achievements:     { type: String },
  },
  { _id: false }
);

const EducationSchema = new mongoose.Schema(
  {
    degree:      { type: String },
    institution: { type: String },
    year:        { type: Number },
    gpa:         { type: Number },
  },
  { _id: false }
);

const CertificationSchema = new mongoose.Schema(
  {
    name:          { type: String },
    issuer:        { type: String },
    date:          { type: Date },
    credentialUrl: { type: String },
  },
  { _id: false }
);

const ProjectSchema = new mongoose.Schema(
  {
    title:           { type: String },
    role:            { type: String },
    description:     { type: String },
    teamSize:        { type: Number },
    technologiesUsed:[String],
    duration:        { type: String },
    outcome:         { type: String },
    githubUrl:       { type: String },
    demoUrl:         { type: String },
    projectType:     { type: String, enum: ["Internal", "OSS", "Client", "Personal"], default: "Personal" },
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const EmployeeSchema = new mongoose.Schema(
  {
    // ── Auth ─────────────────────────────────────────────────────────────────
    fullName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    employeeId: { type: String, unique: true, sparse: true }, // company-assigned ID
    role:       { type: String, default: "employee" },

    // ── Basic Info ────────────────────────────────────────────────────────────
    phone:       { type: String },
    location:    { type: String },
    dateOfBirth: { type: Date },
    gender:      { type: String },
    nationality: { type: String },
    bio:         { type: String },
    photoUrl:    { type: String },   // uploaded avatar URL

    // ── Department ────────────────────────────────────────────────────────────
    department: {
      type: String,
      enum: ["ENG", "HR", "FIN", "MGMT", "DESIGN"],
    },

    // ── External links ────────────────────────────────────────────────────────
    linkedinUrl:  { type: String },
    githubUrl:    { type: String },
    portfolioUrl: { type: String },

    // ── Professional data ─────────────────────────────────────────────────────
    skills:         [SkillSchema],
    experience:     [ExperienceSchema],
    education:      [EducationSchema],
    certifications: [CertificationSchema],
    projects:       [ProjectSchema],

    // ── AI-derived ────────────────────────────────────────────────────────────
    hiddenSkills:   [String],          // AI-detected from projects / experience
    resumeText:     { type: String },  // raw extracted resume text (used for embeddings)

    // ── Pinecone vector reference ─────────────────────────────────────────────
    vectorId: { type: String },        // stores Pinecone vector ID (== _id.toString())

    // ── Onboarding ────────────────────────────────────────────────────────────
    profileComplete:   { type: Boolean, default: false },
    completionPercent: { type: Number,  default: 0 },

    isVerified: { type: Boolean, default: false },
    otp:        { type: String },
    otpExpiry:  { type: Date },
  },
  { timestamps: true }
);

// Indexes
EmployeeSchema.index({ department: 1 });
EmployeeSchema.index({ fullName: "text", email: "text" }); // text search

module.exports = mongoose.model("Employee", EmployeeSchema);
