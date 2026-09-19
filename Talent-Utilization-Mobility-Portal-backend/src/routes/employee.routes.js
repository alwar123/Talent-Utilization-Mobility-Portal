/**
 * employee.routes.js — Employee authentication routes (Phase 1)
 *
 * POST /api/employee/auth/signup
 * POST /api/employee/auth/login
 * GET  /api/employee/auth/verify
 *
 * Phase 2+ routes (profile, resume, jobs, assessments) will be added here.
 */

const { Router } = require('express');
const { body } = require('express-validator');
const { 
  sendOtp, signup, login, verifyToken,
  uploadResume, getProfile, updateProfile, getCompleteness,
  getFitJobs, getUnfitJobs, getJobDetail,
  getGapAnalysis,
  getMyAssessments, getAssessmentDetail, submitAssessment, getAssessmentResult
} = require('../controllers/employee.controller');
const { authenticate } = require('../middleware/auth');
const { uploadResumeMiddleware } = require('../middleware/upload');

const router = Router();

// ── Validation rules ───────────────────────────────────────────────────────────

const signupValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2–100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.'),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required.'),

  body('employeeId')
    .trim()
    .notEmpty().withMessage('Employee ID is required.'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please enter a valid email address.'),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

// ── Phase 1: Auth ──────────────────────────────────────────────────────────────

router.post('/auth/send-otp', sendOtp);
router.post('/auth/signup', signupValidation, signup);
router.post('/auth/login', loginValidation, login);
router.get('/auth/verify', authenticate, verifyToken);

// ── Phase 2: Profile & Resume ──────────────────────────────────────────────────

// Upload resume (PDF/DOCX) -> streams to Cloudinary -> parses via AI service
router.post('/resume', authenticate, uploadResumeMiddleware, uploadResume);

// View and update profile fields (mass assignment protected)
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Get profile completeness score
router.get('/profile/complete', authenticate, getCompleteness);

// ── Phase 3: Jobs & Matching ───────────────────────────────────────────────────

// Get fit jobs (AI score >= 0.70)
router.get('/jobs/fit', authenticate, getFitJobs);

// Get unfit jobs (AI score < 0.70 with missing skills)
router.get('/jobs/unfit', authenticate, getUnfitJobs);

// Get single job detail
router.get('/jobs/:id', authenticate, getJobDetail);

// ── Phase 4: Gap Analysis ──────────────────────────────────────────────────────

// Get personalized roadmap and missing skills for a job
router.get('/jobs/:id/gap', authenticate, getGapAnalysis);

// ── Phase 5: Assessments ───────────────────────────────────────────────────────

// View scheduled, completed, and cancelled assessments
router.get('/assessments', authenticate, getMyAssessments);

// Start an assessment (fetches questions without answers)
router.get('/assessments/:id', authenticate, getAssessmentDetail);

// Submit assessment answers
router.post('/assessments/:id/submit', authenticate, submitAssessment);

// View assessment result (shows HR action and score)
router.get('/assessments/:id/result', authenticate, getAssessmentResult);

module.exports = router;
