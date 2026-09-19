/**
 * ai.controller.js — Phase 6: AI Career Assistant + GitHub Skill Discovery
 *
 * Routes:
 *   POST /api/ai/chat           — Profile-aware AI chat assistant
 *   POST /api/ai/github/scrape  — GitHub skills auto-detection
 *   GET  /api/ai/market-skills  — In-demand skills for the employee's department
 *
 * Security rules:
 *   - All endpoints require a valid employee JWT.
 *   - Only safe profile fields are forwarded to the AI service (no password,
 *     no internal tokens, no private fields).
 *   - GitHub URL must be present in the employee profile and match a valid
 *     github.com pattern before we call the AI service.
 *   - Skill merging is case-insensitive dedup; existing proficiency levels
 *     are never overwritten by auto-detected entries.
 */

const axios = require('axios');
const { getEmployee } = require('../models/Employee');
const { sendSuccess, sendError } = require('../utils/response');

// Lazy model alias — resolved after connectDatabases() completes
let _E;
const Employee = new Proxy({}, { get: (_, p) => { const m = _E || (_E = getEmployee()); const v = m[p]; return typeof v === 'function' ? v.bind(m) : v; } });


const AI_URL = () => process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Only these fields are sent to the AI — never expose password, tokens, etc.
const SAFE_PROFILE_FIELDS = [
  '_id', 'fullName', 'email', 'department', 'designation',
  'skills', 'experience', 'education', 'certifications', 'projects',
  'summary', 'githubUrl', 'linkedinUrl', 'portfolioUrl', 'profileComplete',
];

const GITHUB_URL_RE = /^https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,38})?[a-zA-Z0-9]?)(?:\/.*)?$/;
const MAX_MESSAGE_LENGTH = 2000;

/**
 * Build a safe, shallow copy of the employee document for the AI payload.
 */
function buildSafeProfile(employee) {
  const raw = employee.toJSON ? employee.toJSON() : employee;
  const safe = {};
  for (const field of SAFE_PROFILE_FIELDS) {
    if (raw[field] !== undefined) safe[field] = raw[field];
  }
  return safe;
}

// ── POST /api/ai/chat ──────────────────────────────────────────────────────────

const chat = async (req, res) => {
  const { message, session_id } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return sendError(res, 'Message is required and cannot be empty.', 400);
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return sendError(res, `Message must not exceed ${MAX_MESSAGE_LENGTH} characters.`, 400);
  }

  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const safeProfile = buildSafeProfile(employee);

    const aiRes = await axios.post(`${AI_URL()}/ai/chat`, {
      message: message.trim(),
      session_id: session_id || 'default',
      employee_profile: safeProfile,
    }, { timeout: 30000 });

    return sendSuccess(res, { reply: aiRes.data.reply }, 'Chat response generated.');
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.detail || 'AI service returned an error.';
      return sendError(res, detail, status >= 500 ? 502 : status);
    }
    console.error('[chat] Error:', err.message);
    return sendError(res, 'AI service is temporarily unavailable.', 502);
  }
};

// ── POST /api/ai/github/scrape ─────────────────────────────────────────────────

const scrapeGithub = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    const { githubUrl } = employee;

    // 1. Validate the stored GitHub URL
    if (!githubUrl || !githubUrl.trim()) {
      return sendError(
        res,
        'No GitHub URL found in your profile. Please add a GitHub URL via PUT /api/employee/profile first.',
        400
      );
    }
    if (!GITHUB_URL_RE.test(githubUrl.trim())) {
      return sendError(
        res,
        'The stored GitHub URL is invalid. Expected format: https://github.com/username',
        422
      );
    }

    // 2. Call AI service
    let githubData;
    try {
      const aiRes = await axios.post(`${AI_URL()}/ai/scrape-github`, {
        github_url: githubUrl.trim(),
      }, { timeout: 20000 });
      githubData = aiRes.data;
    } catch (err) {
      if (err.response) {
        const detail = err.response.data?.detail || 'GitHub scraping failed.';
        return sendError(res, detail, err.response.status >= 500 ? 502 : err.response.status);
      }
      return sendError(res, 'GitHub scraping service is temporarily unavailable.', 502);
    }

    // 3. Merge detected languages into skills — case-insensitive dedup, never overwrite existing levels
    const detectedLanguages = (githubData.languages_detected || []).filter(Boolean);

    // Build a lowercase set of existing skill names for fast lookup
    const existingSkillNames = new Set(
      (employee.skills || []).map(s => s.name.toLowerCase())
    );

    const newSkills = [];
    for (const lang of detectedLanguages) {
      if (!existingSkillNames.has(lang.toLowerCase())) {
        newSkills.push({ name: lang, level: 'beginner' }); // Default level for auto-detected
        existingSkillNames.add(lang.toLowerCase()); // Prevent self-duplicates
      }
    }

    if (newSkills.length > 0) {
      employee.skills = [...(employee.skills || []), ...newSkills];
      await employee.save();

      // Re-index Pinecone asynchronously so it doesn't block the response
      axios.post(`${AI_URL()}/ai/index-employee`, {
        employee_id: employee._id.toString(),
        text: JSON.stringify({ skills: employee.skills, experience: employee.experience }),
      }).catch(e => console.error('[scrapeGithub] Re-index failed:', e.message));
    }

    return sendSuccess(res, {
      githubSummary: githubData,
      newSkillsAdded: newSkills.map(s => s.name),
      employee: buildSafeProfile(employee),
    }, `GitHub profile synced. ${newSkills.length} new skill(s) added.`);
  } catch (err) {
    console.error('[scrapeGithub] Error:', err.message);
    return sendError(res, 'Failed to sync GitHub profile.', 500);
  }
};

// ── GET /api/ai/market-skills ─────────────────────────────────────────────────

const getMarketSkills = async (req, res) => {
  try {
    const employee = await Employee.findById(req.employee.id);
    if (!employee) return sendError(res, 'Employee not found.', 404);

    let marketData;
    try {
      const aiRes = await axios.post(`${AI_URL()}/ai/market-skills`, {
        department: employee.department,
        current_skills: employee.skills || [],
      }, { timeout: 30000 });
      marketData = aiRes.data;
    } catch (err) {
      if (err.response) {
        return sendError(res, 'AI market-skills service returned an error.', 502);
      }
      return sendError(res, 'AI market-skills service is unavailable.', 502);
    }

    return sendSuccess(res, { marketSkills: marketData }, 'Market skills retrieved.');
  } catch (err) {
    console.error('[getMarketSkills] Error:', err.message);
    return sendError(res, 'Failed to retrieve market skills.', 500);
  }
};

module.exports = { chat, scrapeGithub, getMarketSkills };
