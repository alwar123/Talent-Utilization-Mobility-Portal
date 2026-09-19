const bcrypt     = require("bcryptjs");
const jwt        = require("jsonwebtoken");
const axios      = require("axios");

const HRAdmin    = require("../models/HRAdmin");
const Job        = require("../models/Job");
const Assessment = require("../models/Assessment");
const Employee   = require("../models/Employee");

const { sendAssessmentEmail, sendResultEmail } = require("../utils/email");
const { buildResultReport }                    = require("../utils/pdf");

// ── Helpers ───────────────────────────────────────────────────────────────────

const AI_URL = () => process.env.AI_SERVICE_URL || "http://localhost:8000";

/** Sign a JWT for an HR admin */
const signToken = (id) =>
  jwt.sign({ id, role: "hr" }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ═════════════════════════════════════════════════════════════════════════════
// AUTH
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/hr/auth/signup
 * Body: { fullName, email, password }
 */
exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password)
      return res.status(400).json({ error: "fullName, email and password are required" });

    const existing = await HRAdmin.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const hr     = await HRAdmin.create({ fullName, email, password: hashed });
    const token  = signToken(hr._id);

    res.status(201).json({
      token,
      user: { id: hr._id, fullName: hr.fullName, email: hr.email, role: "hr" },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/hr/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const hr = await HRAdmin.findOne({ email: email.toLowerCase() });
    if (!hr)
      return res.status(401).json({ error: "Invalid credentials" });

    const match = await bcrypt.compare(password, hr.password);
    if (!match)
      return res.status(401).json({ error: "Invalid credentials" });

    const token = signToken(hr._id);

    res.json({
      token,
      user: { id: hr._id, fullName: hr.fullName, email: hr.email, role: "hr" },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// JOB MANAGEMENT
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/hr/jobs
 * Body: { title, department, jdText, requiredSkills[], minExperience,
 *         employmentType, workMode, location }
 */
exports.createJob = async (req, res) => {
  try {
    const {
      title, department, jdText, requiredSkills,
      minExperience, employmentType, workMode, location,
    } = req.body;

    if (!title || !department || !jdText)
      return res.status(400).json({ error: "title, department and jdText are required" });

    const job = await Job.create({
      title,
      department,
      jdText,
      requiredSkills: requiredSkills || [],
      minExperience:  minExperience  || 0,
      employmentType: employmentType || "Full-time",
      workMode:       workMode       || "Hybrid",
      location:       location       || "",
      postedBy:       req.user.id,
    });

    // Fire-and-forget: trigger async AI matching so stats are ready when HR views the job
    axios
      .post(`${AI_URL()}/ai/match-role`, {
        job_id:     job._id.toString(),
        department: job.department,
        jd_text:    job.jdText,
      })
      .then(async (aiRes) => {
        const { fit = [], unfit = [] } = aiRes.data;
        await Job.findByIdAndUpdate(job._id, {
          "matchStats.fitCount":    fit.length,
          "matchStats.unfitCount":  unfit.length,
          "matchStats.lastAnalyzed": new Date(),
        });
      })
      .catch((err) => console.error("[createJob] AI match-role failed:", err.message));

    res.status(201).json({ success: true, job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/jobs?department=ENG
 */
exports.listJobs = async (req, res) => {
  try {
    const { department } = req.query;
    const filter = { isActive: true };
    if (department && department !== "ALL") filter.department = department;

    const jobs = await Job.find(filter)
      .populate("postedBy", "fullName email")
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/jobs/:id
 */
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate("postedBy", "fullName email");
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/hr/jobs/:id
 * Body: partial Job fields
 */
exports.updateJob = async (req, res) => {
  try {
    // Prevent overwriting protected fields
    delete req.body.postedBy;
    delete req.body.matchStats;

    const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * DELETE /api/hr/jobs/:id  (soft delete — sets isActive: false)
 */
exports.deactivateJob = async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json({ success: true, message: "Job deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// JOB MATCH ANALYSIS  (core feature)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/hr/jobs/:id/matches
 * Calls AI → Pinecone query + Groq explanations → returns fit/unfit employee lists
 */
exports.getJobMatches = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });

    // ── AI service call ────────────────────────────────────────────────────
    let fit   = [];
    let unfit = [];

    try {
      const aiResponse = await axios.post(`${AI_URL()}/ai/match-role`, {
        job_id:     job._id.toString(),
        department: job.department,
        jd_text:    job.jdText,
      });
      fit   = aiResponse.data.fit   || [];
      unfit = aiResponse.data.unfit || [];
    } catch (aiErr) {
      console.error("[getJobMatches] AI service error:", aiErr.message);
      return res.status(502).json({ error: "AI service unavailable. Please try again." });
    }

    // ── Enrich with employee details from MongoDB ──────────────────────────
    const fitIds   = fit.map((f) => f.employee_id);
    const unfitIds = unfit.map((u) => u.employee_id);

    const [fitEmployees, unfitEmployees] = await Promise.all([
      Employee.find({ _id: { $in: fitIds } }).select(
        "fullName email department location skills experience profileComplete photoUrl linkedinUrl githubUrl"
      ),
      Employee.find({ _id: { $in: unfitIds } }).select(
        "fullName email department location skills profileComplete photoUrl"
      ),
    ]);

    const fitList = fitEmployees
      .map((emp) => {
        const aiData = fit.find((f) => f.employee_id === emp._id.toString());
        return {
          ...emp.toObject(),
          score:   aiData?.score   || 0,
          reasons: aiData?.reasons || [],
        };
      })
      .sort((a, b) => b.score - a.score);

    const unfitList = unfitEmployees
      .map((emp) => {
        const aiData = unfit.find((u) => u.employee_id === emp._id.toString());
        return {
          ...emp.toObject(),
          score:         aiData?.score          || 0,
          missingSkills: aiData?.missing_skills || [],
        };
      })
      .sort((a, b) => b.score - a.score);

    // ── Update match stats on the job document ─────────────────────────────
    await Job.findByIdAndUpdate(req.params.id, {
      "matchStats.fitCount":    fitList.length,
      "matchStats.unfitCount":  unfitList.length,
      "matchStats.lastAnalyzed": new Date(),
    });

    res.json({ job, fit: fitList, unfit: unfitList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// EMPLOYEE VIEW  (HR read-only)
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/hr/employees?department=ENG&search=john
 */
exports.listEmployees = async (req, res) => {
  try {
    const { department, search } = req.query;
    const filter = {};

    if (department && department !== "ALL") filter.department = department;
    if (search) filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email:    { $regex: search, $options: "i" } },
    ];

    const employees = await Employee.find(filter)
      .select(
        "fullName email department location skills profileComplete " +
        "completionPercent photoUrl githubUrl linkedinUrl createdAt"
      )
      .sort({ fullName: 1 });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/employees/:id
 * Returns full profile + all assessments for this employee
 */
exports.getEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password -otp -otpExpiry");
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const assessments = await Assessment.find({ employeeId: req.params.id })
      .populate("jobId", "title department employmentType workMode")
      .sort({ createdAt: -1 });

    res.json({ employee, assessments });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ASSESSMENTS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/hr/assessment/schedule
 * Body: { jobId, employeeId, scheduledDate, scheduledTime }
 *
 * 1. Validates job + employee exist
 * 2. Prevents duplicate scheduling
 * 3. Calls AI to generate 30 MCQs
 * 4. Saves assessment
 * 5. Sends email notification to employee
 */
exports.scheduleAssessment = async (req, res) => {
  try {
    const { jobId, employeeId, scheduledDate, scheduledTime } = req.body;

    if (!jobId || !employeeId || !scheduledDate || !scheduledTime)
      return res.status(400).json({ error: "jobId, employeeId, scheduledDate and scheduledTime are required" });

    const [job, employee] = await Promise.all([
      Job.findById(jobId),
      Employee.findById(employeeId).select("fullName email skills"),
    ]);

    if (!job)      return res.status(404).json({ error: "Job not found" });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    // Prevent duplicate active assessment for same job-employee pair
    const existing = await Assessment.findOne({
      jobId,
      employeeId,
      status: { $in: ["upcoming", "in-progress"] },
    });
    if (existing)
      return res.status(409).json({ error: "An active assessment already exists for this employee and role" });

    // ── Generate MCQs from AI ──────────────────────────────────────────────
    let questions = [];
    try {
      const mcqRes = await axios.post(`${AI_URL()}/ai/generate-mcq`, {
        role_title:      job.title,
        jd_text:         job.jdText,
        employee_skills: JSON.stringify(employee.skills || []),
      });
      questions = mcqRes.data.questions || [];
    } catch (aiErr) {
      console.error("[scheduleAssessment] MCQ generation failed:", aiErr.message);
      return res.status(502).json({ error: "AI service failed to generate questions. Please retry." });
    }

    if (questions.length === 0)
      return res.status(500).json({ error: "AI returned 0 questions. Please retry." });

    // ── Create assessment record ───────────────────────────────────────────
    const assessment = await Assessment.create({
      jobId,
      employeeId,
      scheduledDate: new Date(scheduledDate),
      scheduledTime,
      questions,
      status: "upcoming",
    });

    // ── Notify employee via email (non-blocking) ───────────────────────────
    sendAssessmentEmail(
      employee.email,
      employee.fullName,
      job.title,
      scheduledDate,
      scheduledTime
    ).catch((e) => console.error("[scheduleAssessment] Email failed:", e.message));

    res.status(201).json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/assessments?status=upcoming|completed|in-progress|cancelled|all
 */
exports.listAssessments = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;

    const assessments = await Assessment.find(filter)
      .populate("jobId",      "title department employmentType workMode")
      .populate("employeeId", "fullName email department photoUrl")
      .sort({ scheduledDate: -1 });

    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/assessments/:id
 */
exports.getAssessmentDetail = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("jobId",      "title department jdText requiredSkills")
      .populate("employeeId", "fullName email department skills photoUrl");

    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/hr/assessments/:id/action
 * Body: { action: "accepted"|"rejected", feedback?: string }
 *
 * Triggers email to employee.
 */
exports.hrAction = async (req, res) => {
  try {
    const { action, feedback } = req.body;

    if (!["accepted", "rejected"].includes(action))
      return res.status(400).json({ error: "action must be 'accepted' or 'rejected'" });

    const assessment = await Assessment.findById(req.params.id)
      .populate("jobId",      "title department")
      .populate("employeeId", "fullName email");

    if (!assessment)
      return res.status(404).json({ error: "Assessment not found" });

    if (assessment.status !== "completed")
      return res.status(400).json({ error: "Can only act on completed assessments" });

    if (assessment.hrAction !== "pending")
      return res.status(409).json({ error: "HR action already recorded for this assessment" });

    // Update the record
    assessment.hrAction   = action;
    assessment.hrFeedback = feedback || "";
    assessment.notifiedEmployee = true;
    await assessment.save();

    // Notify employee (non-blocking)
    sendResultEmail(
      assessment.employeeId.email,
      assessment.employeeId.fullName,
      assessment.jobId.title,
      action,
      feedback
    ).catch((e) => console.error("[hrAction] Result email failed:", e.message));

    res.json({ success: true, assessment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/hr/assessments/:id/download
 * Returns structured JSON report — frontend renders this as PDF using jsPDF
 */
exports.downloadResult = async (req, res) => {
  try {
    const assessment = await Assessment.findById(req.params.id)
      .populate("jobId",      "title department")
      .populate("employeeId", "fullName email department");

    if (!assessment) return res.status(404).json({ error: "Assessment not found" });

    if (assessment.status !== "completed")
      return res.status(400).json({ error: "Result only available for completed assessments" });

    const report = buildResultReport(assessment);
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/hr/analytics
 * Returns workforce-wide analytics for the HR dashboard.
 */
exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalEmployees,
      totalActiveJobs,
      assessmentStats,
      skillAgg,
      deptAgg,
      recentAssessments,
      jobMatchSummary,
    ] = await Promise.all([

      // 1. Total employees
      Employee.countDocuments(),

      // 2. Active job openings
      Job.countDocuments({ isActive: true }),

      // 3. Assessment counts by hrAction
      Assessment.aggregate([
        { $group: { _id: "$hrAction", count: { $sum: 1 } } },
      ]),

      // 4. Top 10 skills across all employees
      Employee.aggregate([
        { $unwind: "$skills" },
        { $group: { _id: "$skills.name", count: { $sum: 1 } } },
        { $sort:  { count: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, skill: "$_id", count: 1 } },
      ]),

      // 5. Employee count by department
      Employee.aggregate([
        { $group: { _id: "$department", count: { $sum: 1 } } },
        { $project: { _id: 0, department: "$_id", count: 1 } },
      ]),

      // 6. Recent 5 completed assessments
      Assessment.find({ status: "completed" })
        .populate("jobId",      "title department")
        .populate("employeeId", "fullName photoUrl")
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("jobId employeeId score percentage hrAction updatedAt"),

      // 7. Per-job match summary (fit/unfit counts from cached matchStats)
      Job.find({ isActive: true })
        .select("title department matchStats")
        .sort({ "matchStats.lastAnalyzed": -1 })
        .limit(10),
    ]);

    // ── Flatten assessment stats into an object ────────────────────────────
    const assessmentSummary = { pending: 0, accepted: 0, rejected: 0 };
    assessmentStats.forEach(({ _id, count }) => {
      if (_id) assessmentSummary[_id] = count;
    });

    // ── Profile completion distribution ───────────────────────────────────
    const profileCompletionAgg = await Employee.aggregate([
      {
        $bucket: {
          groupBy: "$completionPercent",
          boundaries: [0, 25, 50, 75, 101],
          default: "unknown",
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    res.json({
      overview: {
        totalEmployees,
        totalActiveJobs,
        assessments: assessmentSummary,
      },
      topSkills:          skillAgg,
      employeesByDept:    deptAgg,
      recentAssessments,
      jobMatchSummary,
      profileCompletion:  profileCompletionAgg,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
