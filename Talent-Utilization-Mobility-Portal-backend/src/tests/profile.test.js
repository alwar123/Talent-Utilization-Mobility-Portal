/**
 * profile.test.js — Phase 2 Profile Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');
// Mock Axios for AI Service calls
jest.mock('axios');

// ── Polyfill env vars ─────────────────────────────────────────────────────────
process.env.JWT_SECRET = 'test_jwt_secret_32chars_long_!!';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';

// ── Mock DB ──────────────────────────────────────────────────────────────────
let mockEmployeeConn;
let mongoServer;

jest.mock('../config/db', () => {
  return {
    connectDatabases: jest.fn(),
    get employeeConn() { return mockEmployeeConn; },
    get adminConn() { return mockEmployeeConn; },
  };
});

let app;
let validToken;
let employeeId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  mockEmployeeConn = mongoose.createConnection(uri);
  await mockEmployeeConn.asPromise();

  // Load app AFTER mock is ready
  app = require('../../server');

  // Create a test user
  const Employee = require('../models/Employee');
  const emp = await Employee.create({
    fullName: 'Profile Test',
    email: 'profile@example.com',
    password: 'password123',
    department: 'ENG',
    employeeId: 'P001'
  });
  employeeId = emp._id.toString();

  // Generate token using the login endpoint
  const res = await request(app)
    .post('/api/employee/auth/login')
    .send({ email: 'profile@example.com', password: 'password123' });
  validToken = res.body.data.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 2: Profile Endpoints', () => {
  it('GET /api/employee/profile - should return profile', async () => {
    const res = await request(app)
      .get('/api/employee/profile')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.fullName).toBe('Profile Test');
    expect(res.body.data.employee.password).toBeUndefined(); // ensure password is not leaked
  });

  it('PUT /api/employee/profile - should allow safe updates and protect restricted fields', async () => {
    // Mock the AI indexing call
    axios.post.mockResolvedValueOnce({ data: { status: 'indexed' } });

    const res = await request(app)
      .put('/api/employee/profile')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        skills: [{ name: 'JavaScript' }, { name: 'React' }],
        password: 'hacked_password', // Should be ignored
        role: 'ADMIN', // Should be ignored
        department: 'HR' // Department shouldn't be blindly updated without HR processes, but we allow it for now or rely on specific field exclusions. Actually, our controller prevents mass assignment of password, role, employeeId, isActive.
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.employee.skills).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'JavaScript' })])
    );
    
    // Check that role and password were NOT updated
    const Employee = require('../models/Employee');
    const dbEmp = await Employee.findById(employeeId).select('+password');
    expect(dbEmp.role).toBe('employee');
    
    const isHackMatch = await dbEmp.comparePassword('hacked_password');
    expect(isHackMatch).toBe(false); // password didn't change
  });

  it('GET /api/employee/profile/complete - should calculate completeness', async () => {
    const res = await request(app)
      .get('/api/employee/profile/complete')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.completeness).toBe('number');
  });

  it('POST /api/employee/resume - should fail if no file is provided', async () => {
    const res = await request(app)
      .post('/api/employee/resume')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
