/**
 * Job.js — Read-only model for HR-posted Jobs
 *
 * Binds to `adminConn` so it reads from the shared admin database.
 * Employees cannot create, update, or delete jobs.
 */

const mongoose = require('mongoose');
const { adminConn } = require('../config/db');

const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    description: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    // HR side might have other fields, but we only strictly type what we need
  },
  { 
    timestamps: true,
    strict: false, // Allows us to read documents that have more fields (like 'requirements') without dropping them
  }
);

// We define it on adminConn, NOT the default mongoose connection
const Job = adminConn.model('Job', JobSchema);

module.exports = Job;
