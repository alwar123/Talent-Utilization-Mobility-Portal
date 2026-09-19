/**
 * ai.routes.js — Phase 6 AI routes
 *
 * All routes require authenticated employee JWT.
 * Mounted at /api/ai in server.js.
 */

const { Router } = require('express');
const { body, validationResult } = require('express-validator');
const { chat, scrapeGithub, getMarketSkills } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');

const router = Router();

// ── Input validation middleware ────────────────────────────────────────────────

const chatValidation = [
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required.')
    .isLength({ max: 2000 }).withMessage('Message must not exceed 2000 characters.'),
  body('session_id')
    .optional()
    .trim()
    .isLength({ max: 128 }).withMessage('session_id must not exceed 128 characters.'),
];

const validateInput = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(),
    });
  }
  next();
};

// ── POST /api/ai/chat ──────────────────────────────────────────────────────────
// Profile-aware AI career assistant. Returns {reply}.
router.post('/chat', authenticate, chatValidation, validateInput, chat);

// ── POST /api/ai/github/scrape ─────────────────────────────────────────────────
// Scrapes the employee's stored githubUrl, detects languages, merges into skills.
router.post('/github/scrape', authenticate, scrapeGithub);

// ── GET /api/ai/market-skills ──────────────────────────────────────────────────
// Returns in-demand skills for the employee's department.
router.get('/market-skills', authenticate, getMarketSkills);

module.exports = router;
