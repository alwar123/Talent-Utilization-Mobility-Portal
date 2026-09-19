const express = require("express");
const router  = express.Router();
const auth    = require("../middleware/auth");
const hr      = require("../controllers/hr.controller");

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post("/auth/signup", hr.signup);
router.post("/auth/login",  hr.login);

// ── Job Openings ──────────────────────────────────────────────────────────────
router.post(  "/jobs",              auth("hr"), hr.createJob);
router.get(   "/jobs",              auth("hr"), hr.listJobs);
router.get(   "/jobs/:id",          auth("hr"), hr.getJob);
router.put(   "/jobs/:id",          auth("hr"), hr.updateJob);
router.delete("/jobs/:id",          auth("hr"), hr.deactivateJob);
router.get(   "/jobs/:id/matches",  auth("hr"), hr.getJobMatches);

// ── Employees (HR read-only view) ─────────────────────────────────────────────
router.get("/employees",     auth("hr"), hr.listEmployees);
router.get("/employees/:id", auth("hr"), hr.getEmployeeProfile);

// ── Assessments ───────────────────────────────────────────────────────────────
router.post("/assessment/schedule",      auth("hr"), hr.scheduleAssessment);
router.get( "/assessments",              auth("hr"), hr.listAssessments);
router.get( "/assessments/:id",          auth("hr"), hr.getAssessmentDetail);
router.post("/assessments/:id/action",   auth("hr"), hr.hrAction);
router.get( "/assessments/:id/download", auth("hr"), hr.downloadResult);

// ── Analytics ─────────────────────────────────────────────────────────────────
router.get("/analytics", auth("hr"), hr.getAnalytics);

module.exports = router;
