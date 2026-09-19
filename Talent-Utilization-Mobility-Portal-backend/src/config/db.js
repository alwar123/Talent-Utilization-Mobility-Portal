/**
 * db.js — Dual MongoDB connection manager
 *
 * employeeConn → MONGODB_URI_EMPLOYEE  (Employee collection)
 * adminConn    → MONGODB_URI_ADMIN     (Job, Assessment — shared with HR side)
 *
 * Both connections are exported so models can bind to the correct database.
 */

const mongoose = require('mongoose');

// ── Helpers ──────────────────────────────────────────────────────────────────

const CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

/**
 * Create and return a named Mongoose connection.
 * Logs the connection name so multi-DB startup is easy to trace.
 */
function createConnection(uri, label) {
  if (!uri) {
    throw new Error(`[DB] ${label}: environment variable is not set.`);
  }

  const conn = mongoose.createConnection(uri, CONNECTION_OPTIONS);

  conn.on('connected', () => {
    // Mask credentials in the logged URI for safety
    const safeUri = uri.replace(/:\/\/[^@]+@/, '://***:***@');
    console.log(`[DB] ${label} connected → ${safeUri}`);
  });

  conn.on('error', (err) => {
    console.error(`[DB] ${label} error:`, err.message);
  });

  conn.on('disconnected', () => {
    console.warn(`[DB] ${label} disconnected.`);
  });

  return conn;
}

// ── Connections ───────────────────────────────────────────────────────────────

let employeeConn = null;
let adminConn = null;

/**
 * connectDatabases()
 * Initialises both connections. Called once from server.js at startup.
 * Returns a promise that resolves when both connections are ready.
 */
async function connectDatabases() {
  employeeConn = createConnection(
    process.env.MONGODB_URI_EMPLOYEE,
    'EmployeeDB'
  );

  adminConn = createConnection(
    process.env.MONGODB_URI_ADMIN,
    'AdminDB'
  );

  // Wait for both connections to be ready before the server starts accepting
  await Promise.all([
    employeeConn.asPromise(),
    adminConn.asPromise(),
  ]);

  console.log('[DB] All database connections established.');
}

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  connectDatabases,
  get employeeConn() {
    return employeeConn;
  },
  get adminConn() {
    return adminConn;
  },
};
