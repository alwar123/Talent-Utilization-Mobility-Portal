/**
 * employee.controller.js
 */

const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const axios = require('axios');
const { getEmployee }   = require('../models/Employee');
const { getJob }        = require('../models/Job');
const { getAssessment } = require('../models/Assessment');
const { sendSuccess, sendError, sendValidationError } = require('../utils/response');
const { uploadToCloudinary } = require('../middleware/upload');

// ── Lazy model references ─────────────────────────────────────────────────────
// These are resolved on first use (after connectDatabases() has completed).
// Returned functions are bound to the model to allow Mongoose query chaining.
let _E, _J, _A;
const Employee   = new Proxy({}, { get: (_, p) => { const m = _E || (_E = getEmployee()); const v = m[p]; return typeof v === 'function' ? v.bind(m) : v; } });
const Job        = new Proxy({}, { get: (_, p) => { const m = _J || (_J = getJob());        const v = m[p]; return typeof v === 'function' ? v.bind(m) : v; } });
const Assessment = new Proxy({}, { get: (_, p) => { const m = _A || (_A = getAssessment()); const v = m[p]; return typeof v === 'function' ? v.bind(m) : v; } });

const JWT_EXPIRY = '7d';

function generateToken(employee) {
  const payload = {
    id: employee._id.toString(),
    email: employee.email,
    role: employee.role,
    department: employee.department,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// ── Phase 1: Auth ──────────────────────────────────────────────────────────────

const signup = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { fullName, email, password, department, employeeId } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const existingByEmail = await Employee.findOne({ email: normalizedEmail });
    if (existingByEmail) return sendError(res, 'An account with this email already exists.', 409);

    const existingById = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (existingById) return sendError(res, 'An account with this Employee ID already exists.', 409);

    const employee = await Employee.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password,
      department: department.trim().toUpperCase(),
      employeeId: employeeId.trim().toUpperCase(),
    });

    const token = generateToken(employee);
    return sendSuccess(res, { employee, token }, 'Account created successfully.', 201);
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      return sendError(res, `An account with this ${field === 'employeeId' ? 'Employee ID' : 'email'} already exists.`, 409);
    }
    console.error('[signup] Error:', err.message);
    return sendError(res, 'Signup failed. Please try again later.', 500);
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return sendValidationError(res, errors.array());

  const { email, password } = req.body;

  try {
    const employee = await Employee.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!employee) return sendError(res, 'Invalid credentials.', 401);
    if (!employee.isActive) return sendError(res, 'Your account has been deactivated. Please contact HR.', 403);

    const isMatch = await employee.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid credentials.', 401);

    const token = generateToken(employee);
    const employeeData = employee.toJSON();
    return sendSuccess(res, { employee: employeeData, token }, 'Login successful.');
  } catch (err) {
    console.error('[login] Error:', err.message);
    return sendError(res, 'Login failed. Please try again later.', 500);
  }
};

const verifyToken = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);
    if (!employee.isActive) return sendError(res, 'Account deactivated.', 403);
    return sendSuccess(res, { employee }, 'Token is valid.');
  } catch (err) {
    console.error('[verifyToken] Error:', err.message);
    return sendError(res, 'Could not retrieve employee data.', 500);
  }
};

// ── Phase 2: Profile & Resume ──────────────────────────────────────────────────

const uploadResume = async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No resume file found.', 400);
  }

  try {
    // 1. Upload to Cloudinary
    const secureUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    // 2. Send to AI Service for parsing
    const aiUrl = `${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/parse-resume`;
    let parsedData = null;
    try {
      // We pass the secure URL to the Python service for it to download and parse
      const aiRes = await axios.post(aiUrl, { resume_url: secureUrl }, { timeout: 30000 });
      parsedData = aiRes.data;
    } catch (aiErr) {
      console.error('[uploadResume] AI parsing failed:', aiErr.message);
      // We still save the resume URL even if AI fails, but let the user know
      const employee = await Employee.findByIdAndUpdate(req.employee.id, { resumeUrl: secureUrl }, { new: true });
      return sendSuccess(res, { employee }, 'Resume uploaded, but AI parsing failed.', 200);
    }

    // 3. Save parsed data to DB
    const updatePayload = {
      resumeUrl: secureUrl,
    };

    if (parsedData) {
      if (parsedData.skills) updatePayload.skills = parsedData.skills;
      if (parsedData.experience) updatePayload.experience = parsedData.experience;
      if (parsedData.education) updatePayload.education = parsedData.education;
      if (parsedData.certifications) updatePayload.certifications = parsedData.certifications;
    }

    const employee = await Employee.findByIdAndUpdate(req.employee.id, updatePayload, { new: true });

    // 4. Try to re-index employee
    try {
      await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/index-employee`, {
        employee_id: employee._id.toString(),
        text: JSON.stringify({ skills: employee.skills, experience: employee.experience })
      });
    } catch (idxErr) {
      console.error('[uploadResume] Pinecone indexing failed:', idxErr.message);
    }

    return sendSuccess(res, { employee }, 'Resume parsed and profile updated successfully.');
  } catch (err) {
    console.error('[uploadResume] Error:', err.message);
    return sendError(res, 'Failed to process resume.', 500);
  }
};

const getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);
    return sendSuccess(res, { employee }, 'Profile retrieved.');
  } catch (err) {
    console.error('[getProfile] Error:', err.message);
    return sendError(res, 'Could not retrieve profile.', 500);
  }
};

const updateProfile = async (req, res) => {
  try {
    // Prevent mass-assignment of restricted fields
    const { password, role, employeeId, isActive, ...safeUpdates } = req.body;
    
    const employee = await Employee.findByIdAndUpdate(req.employee.id, safeUpdates, { new: true, runValidators: true });
    
    // Re-index employee asynchronously if skills/exp changed
    if (safeUpdates.skills || safeUpdates.experience) {
      axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/index-employee`, {
        employee_id: employee._id.toString(),
        text: JSON.stringify({ skills: employee.skills, experience: employee.experience })
      }).catch(e => console.error('[updateProfile] Indexing failed:', e.message));
    }

    return sendSuccess(res, { employee }, 'Profile updated successfully.');
  } catch (err) {
    console.error('[updateProfile] Error:', err.message);
    return sendError(res, 'Failed to update profile.', 500);
  }
};

const getCompleteness = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    let score = 0;
    if (employee.skills && employee.skills.length > 0) score += 25;
    if (employee.experience && employee.experience.length > 0) score += 25;
    if (employee.education && employee.education.length > 0) score += 25;
    if (employee.resumeUrl) score += 25;

    return sendSuccess(res, { completeness: score }, 'Completeness calculated.');
  } catch (err) {
    console.error('[getCompleteness] Error:', err.message);
    return sendError(res, 'Failed to calculate completeness.', 500);
  }
};

// ── Phase 3: Jobs & Matching ───────────────────────────────────────────────────

const fetchScoredJobs = async (employee, filterScoreFn) => {
  // 1. Fetch active jobs for the employee's department
  const jobs = await Job.find({ department: employee.department, isActive: true }).lean();
  if (!jobs.length) return [];

  // 2. Call AI service for scoring
  let scoredData = [];
  try {
    const aiRes = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/employee-job-scores`, {
      employee_id: employee._id.toString(),
      employee_skills: employee.skills || [],
      jobs: jobs.map(j => ({ job_id: j._id.toString(), description: j.description || j.title }))
    }, { timeout: 60000 });
    scoredData = aiRes.data; // Array of { job_id, score, reasons, missing_skills }
  } catch (err) {
    console.error('[fetchScoredJobs] AI service failed:', err.message);
    // If AI fails, return jobs without scores
    return jobs.map(j => ({ ...j, ai_score: null }));
  }

  // 3. Merge and filter
  const merged = jobs.map(j => {
    const aiData = scoredData.find(s => s.job_id === j._id.toString()) || { score: 0, reasons: [], missing_skills: [] };
    return { ...j, ai_data: aiData };
  });

  const filtered = merged.filter(filterScoreFn);
  // Sort descending by score
  return filtered.sort((a, b) => (b.ai_data?.score || 0) - (a.ai_data?.score || 0));
};

const getFitJobs = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    const fitJobs = await fetchScoredJobs(employee, (j) => j.ai_score === null || j.ai_data.score >= 0.70);
    return sendSuccess(res, { jobs: fitJobs }, 'Fit jobs retrieved.');
  } catch (err) {
    console.error('[getFitJobs] Error:', err.message);
    return sendError(res, 'Failed to retrieve fit jobs.', 500);
  }
};

const getUnfitJobs = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    const unfitJobs = await fetchScoredJobs(employee, (j) => j.ai_score !== null && j.ai_data.score < 0.70);
    return sendSuccess(res, { jobs: unfitJobs }, 'Unfit jobs retrieved.');
  } catch (err) {
    console.error('[getUnfitJobs] Error:', err.message);
    return sendError(res, 'Failed to retrieve unfit jobs.', 500);
  }
};

const getJobDetail = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return sendError(res, 'Job not found.', 404);
    
    // Prevent viewing jobs from other departments
    if (job.department !== req.employee.department) {
      return sendError(res, 'You do not have access to view this job.', 403);
    }
    
    return sendSuccess(res, { job }, 'Job details retrieved.');
  } catch (err) {
    console.error('[getJobDetail] Error:', err.message);
    return sendError(res, 'Failed to retrieve job details.', 500);
  }
};

// ── Phase 4: Gap Analysis ──────────────────────────────────────────────────────

const getGapAnalysis = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) return sendError(res, 'Job not found.', 404);

    if (job.department !== req.employee.department) {
      return sendError(res, 'You do not have access to this job.', 403);
    }

    const employee = await Employee.findById(req.employee.id).lean();

    // Call AI Service
    let gapAnalysis = null;
    try {
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/gap-analysis`, {
        employee_skills: employee.skills || [],
        experience: employee.experience || [],
        job_title: job.title,
        job_description: job.description,
        job_requirements: job.requirements || '' // Pass requirements if they exist, else empty
      }, { timeout: 60000 });
      gapAnalysis = aiRes.data;
    } catch (err) {
      console.error('[getGapAnalysis] AI service failed:', err.message);
      return sendError(res, 'Failed to generate gap analysis from AI service.', 502);
    }

    return sendSuccess(res, { job, gapAnalysis }, 'Gap analysis generated.');
  } catch (err) {
    console.error('[getGapAnalysis] Error:', err.message);
    return sendError(res, 'Failed to retrieve gap analysis.', 500);
  }
};

// ── Phase 5: Assessments ───────────────────────────────────────────────────────

const getMyAssessments = async (req, res) => {
  try {
    const assessments = await Assessment.find({ employeeId: req.employee.id })
      .populate('jobId', 'title department')
      .lean();

    const grouped = { upcoming: [], completed: [], cancelled: [], all: assessments };
    
    for (const a of assessments) {
      if (a.status === 'upcoming') grouped.upcoming.push(a);
      else if (a.status === 'completed') grouped.completed.push(a);
      else if (a.status === 'cancelled') grouped.cancelled.push(a);
    }

    return sendSuccess(res, grouped, 'Assessments retrieved.');
  } catch (err) {
    console.error('[getMyAssessments] Error:', err.message);
    return sendError(res, 'Failed to retrieve assessments.', 500);
  }
};

const getAssessmentDetail = async (req, res) => {
  try {
    // Relying on toJSON to strip correctAnswer when we send it, but we use .lean() here.
    // However, lean() bypasses toJSON! We must manually strip correctAnswer or use Mongoose doc.
    const assessment = await Assessment.findOne({ _id: req.params.id, employeeId: req.employee.id });
    
    if (!assessment) return sendError(res, 'Assessment not found or access denied.', 404);

    return sendSuccess(res, { assessment }, 'Assessment detail retrieved.');
  } catch (err) {
    console.error('[getAssessmentDetail] Error:', err.message);
    return sendError(res, 'Failed to retrieve assessment details.', 500);
  }
};

const submitAssessment = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, employeeId: req.employee.id }).select('+questions.correctAnswer');
    if (!assessment) return sendError(res, 'Assessment not found or access denied.', 404);

    if (assessment.status !== 'upcoming') {
      return sendError(res, 'Assessment is no longer open for submission.', 400);
    }

    const { answers } = req.body;
    if (!answers || !Array.isArray(answers)) {
      return sendError(res, 'Invalid answers payload.', 400);
    }

    // 1. Grade the submission
    let correctCount = 0;
    const totalQuestions = assessment.questions.length;
    
    // Safety check for empty assessments
    if (totalQuestions === 0) {
      return sendError(res, 'Assessment has no questions configured.', 400);
    }

    const submittedAnswers = [];
    
    for (const ans of answers) {
      const q = assessment.questions[ans.questionIndex];
      if (q) {
        submittedAnswers.push({
          questionIndex: ans.questionIndex,
          selectedAnswer: ans.selectedAnswer
        });
        // Grade exactly on the server using the hidden correctAnswer field
        if (q.correctAnswer === ans.selectedAnswer) {
          correctCount++;
        }
      }
    }

    const percentage = Math.round((correctCount / totalQuestions) * 100);

    // 2. Request AI Summary
    let aiSummary = "Completed.";
    try {
      const aiPayload = {
        questions: assessment.questions.map(q => ({ questionText: q.questionText, correctAnswer: q.correctAnswer })),
        submittedAnswers,
        percentage
      };
      
      const aiRes = await axios.post(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/ai/score-assessment`, aiPayload, { timeout: 30000 });
      if (aiRes.data && aiRes.data.summary) {
        aiSummary = aiRes.data.summary;
      }
    } catch (err) {
      console.error('[submitAssessment] AI scoring summary failed:', err.message);
      // Fallback if AI is down
      aiSummary = `You scored ${percentage}%. Server AI summary unavailable.`;
    }

    // 3. Save to DB
    assessment.submittedAnswers = submittedAnswers;
    assessment.score = correctCount;
    assessment.percentage = percentage;
    assessment.aiSummary = aiSummary;
    assessment.status = 'completed';
    assessment.submittedAt = new Date();
    
    await assessment.save();

    return sendSuccess(res, { assessment }, 'Assessment submitted successfully.');
  } catch (err) {
    console.error('[submitAssessment] Error:', err.message);
    return sendError(res, 'Failed to submit assessment.', 500);
  }
};

const getAssessmentResult = async (req, res) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, employeeId: req.employee.id });
    
    if (!assessment) return sendError(res, 'Assessment not found or access denied.', 404);
    if (assessment.status !== 'completed') return sendError(res, 'Assessment is not completed.', 400);

    const result = {
      score: assessment.score,
      percentage: assessment.percentage,
      aiSummary: assessment.aiSummary,
      hrAction: assessment.hrAction,
      hrFeedback: assessment.hrFeedback,
      submittedAt: assessment.submittedAt
    };

    return sendSuccess(res, { result }, 'Assessment result retrieved.');
  } catch (err) {
    console.error('[getAssessmentResult] Error:', err.message);
    return sendError(res, 'Failed to retrieve assessment result.', 500);
  }
};

module.exports = { 
  sendOtp, signup, login, verifyToken, 
  uploadResume, getProfile, updateProfile, getCompleteness,
  getFitJobs, getUnfitJobs, getJobDetail, getGapAnalysis,
  getMyAssessments, getAssessmentDetail, submitAssessment, getAssessmentResult 
};
