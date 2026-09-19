/**
 * jobs.test.js — Phase 3 Job Matching Integration Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
jest.mock('axios');
const axios = require('axios');

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
let jobId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  mockEmployeeConn = mongoose.createConnection(uri);
  await mockEmployeeConn.asPromise();

  // Load app AFTER mock is ready
  app = require('../../server');

  // Create Employee
  const Employee = require('../models/Employee');
  await Employee.create({
    fullName: 'Job Test',
    email: 'job@example.com',
    password: 'password123',
    department: 'ENG',
    employeeId: 'J001',
    skills: [{ name: 'JavaScript' }]
  });

  const res = await request(app)
    .post('/api/employee/auth/login')
    .send({ email: 'job@example.com', password: 'password123' });
  validToken = res.body.data.token;

  // Create Job in Admin DB
  const Job = require('../models/Job');
  const job = await Job.create({
    title: 'Frontend Engineer',
    department: 'ENG',
    description: 'React, JS developer needed.',
    isActive: true
  });
  
  // Create another job in different department
  await Job.create({
    title: 'HR Manager',
    department: 'HR',
    description: 'Looking for HR manager.',
    isActive: true
  });

  jobId = job._id.toString();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Phase 3: Job Endpoints', () => {
  it('GET /api/employee/jobs/fit - should return jobs with score >= 0.70', async () => {
    // Mock the AI matching score
    axios.post.mockResolvedValueOnce({
      data: [{
        job_id: jobId,
        score: 0.85,
        reasons: ['Strong match'],
        missing_skills: []
      }]
    });

    const res = await request(app)
      .get('/api/employee/jobs/fit')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobs).toHaveLength(1); // Only the ENG job should be returned and scored
    expect(res.body.data.jobs[0].title).toBe('Frontend Engineer');
    expect(res.body.data.jobs[0].ai_data.score).toBe(0.85);
  });

  it('GET /api/employee/jobs/unfit - should return jobs with score < 0.70', async () => {
    axios.post.mockResolvedValueOnce({
      data: [{
        job_id: jobId,
        score: 0.55,
        reasons: ['Weak match'],
        missing_skills: ['React']
      }]
    });

    const res = await request(app)
      .get('/api/employee/jobs/unfit')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.jobs).toHaveLength(1);
    expect(res.body.data.jobs[0].ai_data.score).toBe(0.55);
  });

  it('GET /api/employee/jobs/:id - should get detail if department matches', async () => {
    const res = await request(app)
      .get(`/api/employee/jobs/${jobId}`)
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.job.title).toBe('Frontend Engineer');
  });
});
