/**
 * Otp.js — Persists OTPs in MongoDB so they survive server restarts.
 * TTL index on `expiresAt` auto-deletes documents after 10 minutes.
 * Uses the same lazy-init pattern as Employee.js / Job.js.
 */

const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    // MongoDB auto-deletes this document after it expires
    index: { expireAfterSeconds: 0 },
  },
});

// ── Lazy model getter ───────────────────────────────────────────────────────────
// employeeConn is only available after connectDatabases() resolves.
let _Otp = null;

function getOtp() {
  if (!_Otp) {
    const { employeeConn } = require('../config/db');
    _Otp = employeeConn.model('Otp', OtpSchema);
  }
  return _Otp;
}

module.exports = { getOtp };
