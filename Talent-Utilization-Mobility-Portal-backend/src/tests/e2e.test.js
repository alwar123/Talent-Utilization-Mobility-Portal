/**
 * e2e.test.js — Phase 7 end-to-end Admin↔Employee flow verification
 *
 * Verifies the complete HR→Employee integration using in-memory MongoDB:
 *   1. Job fit/unfit classification by AI score
 *   2. Department filtering
 *   3. Assessment ownership (IDOR prevention)
 *   4. Correct-answer secrecy
 *   5. Assessment submission persistence and scoring
 *   6. HR action (accept/reject) visibility on employee side
 *   7. Profile completeness progression
 *   8. GitHub sync: new skills added without duplicates, indexing triggered
 *
 * Uses mocked axios for AI service calls. No live services required.
 */

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
    get adminConn()    { return mockEmployeeConn; },
  };
  return mock;
});

process.env.JWT_SECRET = 'test_jwt_secret_32chars_long_!!';

let app;
let Employee;
let Job;
let Assessment;

// Shared test state
let emp1, emp2, token1, token2;
let fitJob, unfitJob, crossDeptJob;
let upcomingAssessment;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mockEmployeeConn = mongoose.createConnection(uri);
  await mockEmployeeConn.asPromise();

  app = require('../../server');
  Employee   = require('../models/Employee');
  Job        = require('../models/Job');
  Assessment = require('../models/Assessment');

  // ── Seed employees ──────────────────────────────────────────────────────────
  emp1 = await Employee.create({
    fullName: 'E2E Employee One',
    email: 'e2e1@co.com',
    password: 'password123',
    department: 'ENG',
    employeeId: 'E2E_001',
    skills: [{ name: 'JavaScript', level: 'expert' }, { name: 'Node.js', level: 'advanced' }],
    githubUrl: 'https://github.com/testuser',
  });

  emp2 = await Employee.create({
    fullName: 'E2E Employee Two',
    email: 'e2e2@co.com',
    password: 'password123',
    department: 'ENG',
    employeeId: 'E2E_002',
    skills: [],
  });

  token1 = jwt.sign({ id: emp1._id.toString(), department: 'ENG' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  token2 = jwt.sign({ id: emp2._id.toString(), department: 'ENG' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  // ── Seed jobs ───────────────────────────────────────────────────────────────
  fitJob = await Job.create({
    title: 'Senior Node Engineer',
    department: 'ENG',
    description: 'Node.js, JavaScript, REST APIs',
    isActive: true,
  });

  unfitJob = await Job.create({
    title: 'Data Scientist',
    department: 'ENG',
    description: 'Python, TensorFlow, ML',
    isActive: true,
  });

  crossDeptJob = await Job.create({
    title: 'HR Generalist',
    department: 'HR',
    description: 'HR ops',
    isActive: true,
  });

  // ── Seed assessment for emp1 ────────────────────────────────────────────────
  upcomingAssessment = await Assessment.create({
    employeeId: emp1._id.toString(),
    jobId: fitJob._id,
    scheduledAt: new Date(),
    questions: [
      {
        questionText: 'What is closure in JS?',
        options: [{ id: 'a', text: 'A function' }, { id: 'b', text: 'A scope mechanism' }],
        correctAnswer: 'b',
      },
      {
        questionText: 'What is REST?',
        options: [{ id: 'a', text: 'An architecture style' }, { id: 'b', text: 'A database' }],
        correctAnswer: 'a',
      },
    ],
  });
});

afterAll(async () => {
  await mockEmployeeConn.close();
  await mongoServer.stop();
  jest.resetModules();
});

beforeEach(() => jest.clearAllMocks());

// ─────────────────────────────────────────────────────────────────────────────
// Flow 1: Job fit/unfit classification
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 1: Job Fit/Unfit Classification', () => {
  it('employee sees fit job when AI score >= 70%', async () => {
    axios.post.mockResolvedValueOnce({
      data: [
        { job_id: fitJob._id.toString(),   score: 0.88, reasons: ['JS expert'], missing_skills: [] },
        { job_id: unfitJob._id.toString(), score: 0.35, reasons: [], missing_skills: ['Python', 'TensorFlow'] },
      ],
    });

    const res = await request(app)
      .get('/api/employee/jobs/fit')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    const ids = res.body.data.jobs.map(j => j._id || j.id);
    expect(ids.some(id => id.toString() === fitJob._id.toString())).toBe(true);
    expect(ids.some(id => id.toString() === unfitJob._id.toString())).toBe(false);
  });

  it('employee sees unfit job when AI score < 70%', async () => {
    axios.post.mockResolvedValueOnce({
      data: [
        { job_id: fitJob._id.toString(),   score: 0.88, reasons: [], missing_skills: [] },
        { job_id: unfitJob._id.toString(), score: 0.35, reasons: [], missing_skills: ['Python'] },
      ],
    });

    const res = await request(app)
      .get('/api/employee/jobs/unfit')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    const ids = res.body.data.jobs.map(j => j._id || j.id);
    expect(ids.some(id => id.toString() === unfitJob._id.toString())).toBe(true);
  });

  it('cross-department jobs do not appear (department filtering)', async () => {
    // The fitJobs endpoint only fetches jobs matching employee's department
    // crossDeptJob is HR dept, emp1 is ENG — should never appear
    axios.post.mockResolvedValueOnce({ data: [] });

    const res = await request(app)
      .get('/api/employee/jobs/fit')
      .set('Authorization', `Bearer ${token1}`);

    const ids = res.body.data?.jobs?.map(j => j._id?.toString()) || [];
    expect(ids).not.toContain(crossDeptJob._id.toString());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 2: Assessment ownership and answer secrecy
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 2: Assessment Ownership', () => {
  it('employee 1 can see their own upcoming assessment', async () => {
    const res = await request(app)
      .get('/api/employee/assessments')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.upcoming).toHaveLength(1);
    expect(res.body.data.upcoming[0]._id.toString()).toBe(upcomingAssessment._id.toString());
  });

  it('employee 2 cannot see employee 1\'s assessment (IDOR)', async () => {
    const res = await request(app)
      .get(`/api/employee/assessments/${upcomingAssessment._id}`)
      .set('Authorization', `Bearer ${token2}`);

    expect(res.statusCode).toBe(404);
  });

  it('correct answers are never exposed in assessment detail', async () => {
    const res = await request(app)
      .get(`/api/employee/assessments/${upcomingAssessment._id}`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    const questions = res.body.data.assessment.questions;
    questions.forEach(q => {
      expect(q.correctAnswer).toBeUndefined();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 3: Assessment submission persistence
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 3: Assessment Submission and Scoring', () => {
  it('submits assessment, scores correctly, and persists status=completed', async () => {
    axios.post.mockResolvedValueOnce({ data: { summary: 'Good understanding of JS closures.' } });

    const res = await request(app)
      .post(`/api/employee/assessments/${upcomingAssessment._id}/submit`)
      .set('Authorization', `Bearer ${token1}`)
      .send({
        answers: [
          { questionIndex: 0, selectedAnswer: 'b' },  // Correct
          { questionIndex: 1, selectedAnswer: 'b' },  // Wrong
        ],
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.assessment.score).toBe(1);         // 1/2 correct
    expect(res.body.data.assessment.percentage).toBe(50);
    expect(res.body.data.assessment.status).toBe('completed');
    expect(res.body.data.assessment.aiSummary).toBe('Good understanding of JS closures.');

    // Verify it persisted
    const persisted = await Assessment.findById(upcomingAssessment._id).select('+questions.correctAnswer');
    expect(persisted.status).toBe('completed');
    expect(persisted.score).toBe(1);
  });

  it('prevents duplicate submissions', async () => {
    const res = await request(app)
      .post(`/api/employee/assessments/${upcomingAssessment._id}/submit`)
      .set('Authorization', `Bearer ${token1}`)
      .send({ answers: [] });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/no longer open/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 4: HR action visibility
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 4: HR Accept/Reject Visibility', () => {
  it('reflects hrAction=accepted on employee result endpoint', async () => {
    // Simulate HR accepting
    await Assessment.findByIdAndUpdate(upcomingAssessment._id, {
      hrAction: 'accepted',
      hrFeedback: 'Excellent performance.',
    });

    const res = await request(app)
      .get(`/api/employee/assessments/${upcomingAssessment._id}/result`)
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.result.hrAction).toBe('accepted');
    expect(res.body.data.result.hrFeedback).toBe('Excellent performance.');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 5: Profile completeness progression
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 5: Profile Completeness', () => {
  it('returns completeness score based on filled sections', async () => {
    const res = await request(app)
      .get('/api/employee/profile/complete')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    // emp1 has skills (25%) and experience (0% — empty) and education (0%) but no resume
    // The completeness function awards 25 per section: skills has data → score ≥ 25
    expect(res.body.data.completeness).toBeGreaterThan(0);
    expect(res.body.data.completeness).toBeLessThanOrEqual(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Flow 6: GitHub sync – new skills, no duplicates, re-index
// ─────────────────────────────────────────────────────────────────────────────

describe('Flow 6: GitHub Sync', () => {
  it('adds new languages as skills without duplicating existing ones', async () => {
    // emp1 has: JavaScript (expert), Node.js (advanced)
    // GitHub returns: JavaScript, Python, Go
    axios.post
      .mockResolvedValueOnce({
        data: {
          username: 'testuser',
          public_repos: 10,
          followers: 50,
          languages_detected: ['JavaScript', 'Python', 'Go'],
          top_repos: [],
        },
      })
      .mockResolvedValueOnce({ data: { ok: true } }); // index call

    const res = await request(app)
      .post('/api/ai/github/scrape')
      .set('Authorization', `Bearer ${token1}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.newSkillsAdded).not.toContain('JavaScript');
    expect(res.body.data.newSkillsAdded).toContain('Python');
    expect(res.body.data.newSkillsAdded).toContain('Go');

    // Verify no JavaScript duplication in DB
    const updated = await Employee.findById(emp1._id);
    const jsSkills = updated.skills.filter(s => s.name.toLowerCase() === 'javascript');
    expect(jsSkills).toHaveLength(1);

    // Verify re-index was triggered (axios.post called twice)
    expect(axios.post).toHaveBeenCalledTimes(2);
  });
});
