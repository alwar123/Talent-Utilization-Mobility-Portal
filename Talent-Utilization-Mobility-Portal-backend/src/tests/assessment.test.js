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
let Assessment;

describe('Phase 5: Assessment APIs', () => {
  let token1, token2;
  let employee1, employee2;
  let job;
  let assessmentId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    mockEmployeeConn = mongoose.createConnection(uri);
    await mockEmployeeConn.asPromise();

    app = require('../../server');
    Employee = require('../models/Employee');
    Job = require('../models/Job');
    Assessment = require('../models/Assessment');
    await Employee.deleteMany({});
    await Job.deleteMany({});
    await Assessment.deleteMany({});

    employee1 = await Employee.create({
      fullName: 'Alice', email: 'alice@co.com', password: 'password', department: 'ENG', employeeId: 'A1'
    });
    employee2 = await Employee.create({
      fullName: 'Bobson', email: 'bob@co.com', password: 'password', department: 'ENG', employeeId: 'B1'
    });

    job = await Job.create({ title: 'Dev', department: 'ENG', description: 'Desc' });

    token1 = jwt.sign({ id: employee1._id, department: 'ENG' }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
    token2 = jwt.sign({ id: employee2._id, department: 'ENG' }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });

    // HR schedules an assessment for Employee 1
    const assessment = await Assessment.create({
      employeeId: employee1._id.toString(),
      jobId: job._id,
      scheduledAt: new Date(),
      questions: [
        {
          questionText: 'What is Node?',
          options: [{ id: 'a', text: 'Runtime' }, { id: 'b', text: 'Browser' }],
          correctAnswer: 'a'
        },
        {
          questionText: 'What is React?',
          options: [{ id: 'a', text: 'Library' }, { id: 'b', text: 'Database' }],
          correctAnswer: 'a'
        }
      ]
    });
    assessmentId = assessment._id.toString();
  });

  afterAll(async () => {
    await mockEmployeeConn.close();
    await mongoServer.stop();
    jest.resetModules();
  });

  it('should prevent Employee 2 from viewing Employee 1 assessment', async () => {
    const res = await request(app)
      .get(`/api/employee/assessments/${assessmentId}`)
      .set('Authorization', `Bearer ${token2}`);
    
    expect(res.statusCode).toBe(404);
  });

  it('should strip correctAnswer from assessment details', async () => {
    const res = await request(app)
      .get(`/api/employee/assessments/${assessmentId}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    const q1 = res.body.data.assessment.questions[0];
    expect(q1.questionText).toBe('What is Node?');
    expect(q1.correctAnswer).toBeUndefined(); // Security check
  });

  it('should grade assessment and prevent duplicate submissions', async () => {
    axios.post.mockResolvedValueOnce({ data: { summary: 'Good job' } });

    // 1st submission
    const res = await request(app)
      .post(`/api/employee/assessments/${assessmentId}/submit`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        answers: [
          { questionIndex: 0, selectedAnswer: 'a' }, // Correct
          { questionIndex: 1, selectedAnswer: 'b' }  // Incorrect
        ]
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.assessment.score).toBe(1);
    expect(res.body.data.assessment.percentage).toBe(50);
    expect(res.body.data.assessment.status).toBe('completed');
    expect(res.body.data.assessment.aiSummary).toBe('Good job');

    // 2nd submission should fail
    const res2 = await request(app)
      .post(`/api/employee/assessments/${assessmentId}/submit`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ answers: [] });
    
    expect(res2.statusCode).toBe(400);
    expect(res2.body.message).toMatch(/no longer open/i);
  });
});
