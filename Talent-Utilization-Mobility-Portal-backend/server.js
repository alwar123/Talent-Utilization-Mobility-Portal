/**
 * server.js — SkillSphere Employee Backend entry point
 *
 * Startup sequence:
 *   1. Load .env
 *   2. Configure Cloudinary (optional — warns if missing, does not crash)
 *   3. Connect both MongoDB connections (required — exits on failure)
 *   4. Mount Express middleware and routes
 *   5. Start HTTP server
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDatabases } = require('./src/config/db');
const { configureCloudinary } = require('./src/config/cloudinary');

// ── App setup ─────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check (no DB required) ─────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'skillsphere-backend', timestamp: new Date().toISOString() });
});

// ── API routes ─────────────────────────────────────────────────────────────────

// Phase 1 — Employee auth + profile + jobs + assessments
const employeeRoutes = require('./src/routes/employee.routes');
app.use('/api/employee', employeeRoutes);

// Phase 6 — AI Career Assistant + GitHub
const aiRoutes = require('./src/routes/ai.routes');
app.use('/api/ai', aiRoutes);

// ── 404 handler ────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ── Global error handler ───────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[Server] Unhandled error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ── Bootstrap ──────────────────────────────────────────────────────────────────

async function bootstrap() {
  // Cloudinary — optional; missing keys produce a warning, not a crash
  configureCloudinary();

  // MongoDB — required; failure exits the process so Render/Docker restarts it
  try {
    await connectDatabases();
  } catch (err) {
    console.error('[Server] Database connection failed:', err.message);
    process.exit(1);
  }

  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`[Server] SkillSphere backend running on port ${PORT}`);
    });
  }
}

bootstrap();

module.exports = app; // exported for tests
