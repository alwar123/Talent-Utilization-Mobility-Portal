const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');

jest.mock('axios');

let mockEmployeeConn;
let mongoServer;

jest.mock('../config/db', () => {
  const mock = {
    connectDatabases: jest.fn(),
    get employeeConn() { return mockEmployeeConn; },
    get adminConn() { return mockEmployeeConn; },
  };
  return mock;
});

let app;
let Employee;
let Job;

describe('Phase 4: Gap Analysis API', () => {
  let token;
  let employeeId;
  let jobId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mockEmployeeConn = mongoose.createConnection(uri);
    await mockEmployeeConn.asPromise();

    app = require('../../server');
    Employee = require('../models/Employee');
    Job = require('../models/Job');
    await Employee.deleteMany({});
    await Job.deleteMany({});

    // 1. Create a dummy employee
    const emp = await Employee.create({
      fullName: 'Gap User',
      email: 'gap@co.com',
      password: 'password123',
      department: 'ENG',
      employeeId: 'EMP_GAP_001',
      skills: [{ name: 'JavaScript', level: 'beginner' }],
    });
    employeeId = emp._id.toString();

    // 2. Create a dummy job in same department
    const job = await Job.create({
      title: 'Senior Node Developer',
      department: 'ENG',
      description: 'Need Node.js and AWS.',
    });
    jobId = job._id.toString();

    // 3. Generate Token
    const payload = { id: employeeId, email: emp.email, role: emp.role, department: emp.department };
    token = jwt.sign(payload, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await mockEmployeeConn.close();
    await mongoServer.stop();
    jest.resetModules();
  });

  it('should prevent access to jobs from other departments', async () => {
    const wrongDeptJob = await Job.create({
      title: 'HR Manager',
      department: 'HR',
      description: 'HR stuff',
    });

    const res = await request(app)
      .get(`/api/employee/jobs/${wrongDeptJob._id}/gap`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.message).toMatch(/access/i);
  });

  it('should return gap analysis roadmap for a valid job', async () => {
    const mockRoadmap = {
      missing_skills: ['AWS'],
      estimated_time_months: '1',
      roadmap: [{ month: 'Month 1', focus: 'AWS', action_items: ['Learn it'] }]
    };

    axios.post.mockResolvedValueOnce({ data: mockRoadmap });

    const res = await request(app)
      .get(`/api/employee/jobs/${jobId}/gap`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.gapAnalysis.missing_skills).toContain('AWS');
  });
});
