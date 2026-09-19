/**
 * auth.test.js — Integration tests for Phase 1 auth endpoints
 *
 * Uses an in-process MongoDB connection via mongodb-memory-server so no
 * external Atlas credentials are needed during CI.
 *
 * Covers:
 *   POST /api/employee/auth/signup
 *   POST /api/employee/auth/login
 *   GET  /api/employee/auth/verify
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// ── Polyfill process.env before any module import ──────────────────────────────
process.env.JWT_SECRET = 'test_jwt_secret_32chars_long_!!';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

// ── Mock the db module so the app uses our in-memory instance ──────────────────
let mockEmployeeConn;
let mongoServer;

jest.mock('../config/db', () => {
  // We'll replace these getters after spinning up MongoMemoryServer
  const mock = {
    connectDatabases: jest.fn(),
    get employeeConn() { return mockEmployeeConn; },
    get adminConn() { return mockEmployeeConn; }, // same connection for tests
  };
  return mock;
});

// ── Import AFTER mocking ────────────────────────────────────────────────────────
let app;

beforeAll(async () => {
  // Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  mockEmployeeConn = mongoose.createConnection(uri);
  await mockEmployeeConn.asPromise();

  // Now safe to load the app (Employee model will bind to employeeConn)
  app = require('../../server');
});

afterAll(async () => {
  await mockEmployeeConn.close();
  await mongoServer.stop();
  jest.resetModules();
});

// ── Test data ──────────────────────────────────────────────────────────────────

const VALID_EMPLOYEE = {
  fullName: 'Test User',
  email: 'test@skillsphere.com',
  password: 'secure123',
  department: 'ENG',
  employeeId: 'E001',
};

// ── Signup ─────────────────────────────────────────────────────────────────────

describe('POST /api/employee/auth/signup', () => {
  it('creates a new employee and returns a JWT', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send(VALID_EMPLOYEE);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.employee.email).toBe(VALID_EMPLOYEE.email);
    // password must NOT appear in response
    expect(res.body.data.employee.password).toBeUndefined();
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send(VALID_EMPLOYEE);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects duplicate employeeId with 409', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send({ ...VALID_EMPLOYEE, email: 'other@co.com' }); // same employeeId

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rejects missing fields with 422', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send({ email: 'noname@co.com' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  it('rejects an invalid email address with 422', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send({ ...VALID_EMPLOYEE, email: 'not-an-email', employeeId: 'E999' });

    expect(res.status).toBe(422);
  });

  it('rejects a password shorter than 6 chars with 422', async () => {
    const res = await request(app)
      .post('/api/employee/auth/signup')
      .send({ ...VALID_EMPLOYEE, password: '123', email: 'short@co.com', employeeId: 'E998' });

    expect(res.status).toBe(422);
  });
});

// ── Login ──────────────────────────────────────────────────────────────────────

describe('POST /api/employee/auth/login', () => {
  it('returns a JWT on valid credentials', async () => {
    const res = await request(app)
      .post('/api/employee/auth/login')
      .send({ email: VALID_EMPLOYEE.email, password: VALID_EMPLOYEE.password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.employee.password).toBeUndefined();
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app)
      .post('/api/employee/auth/login')
      .send({ email: VALID_EMPLOYEE.email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    // Generic message — must not leak whether it was email or password
    expect(res.body.message).toBe('Invalid credentials.');
  });

  it('rejects non-existent email with 401 (same message as wrong password)', async () => {
    const res = await request(app)
      .post('/api/employee/auth/login')
      .send({ email: 'nobody@co.com', password: 'whatever' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid credentials.');
  });

  it('rejects missing fields with 422', async () => {
    const res = await request(app)
      .post('/api/employee/auth/login')
      .send({});

    expect(res.status).toBe(422);
  });
});

// ── Verify ─────────────────────────────────────────────────────────────────────

describe('GET /api/employee/auth/verify', () => {
  let validToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/employee/auth/login')
      .send({ email: VALID_EMPLOYEE.email, password: VALID_EMPLOYEE.password });
    validToken = res.body.data.token;
  });

  it('returns employee data for a valid token', async () => {
    const res = await request(app)
      .get('/api/employee/auth/verify')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.email).toBe(VALID_EMPLOYEE.email);
    expect(res.body.data.employee.password).toBeUndefined();
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/employee/auth/verify');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an invalid token', async () => {
    const res = await request(app)
      .get('/api/employee/auth/verify')
      .set('Authorization', 'Bearer this.is.not.valid');

    expect(res.status).toBe(401);
  });
});
