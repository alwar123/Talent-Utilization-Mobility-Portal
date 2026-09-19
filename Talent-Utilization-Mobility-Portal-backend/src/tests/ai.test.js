/**
 * ai.test.js — Phase 6 integration tests
 *
 * Covers:
 *   POST /api/ai/chat           — auth guard, validation, AI fallback
 *   POST /api/ai/github/scrape  — URL validation, skill merge, dedup, re-index
 *   GET  /api/ai/market-skills  — auth guard, response structure
 *
 * Uses MongoMemoryServer + mocked axios. No live services required.
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
let employee;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  mockEmployeeConn = mongoose.createConnection(uri);
  await mockEmployeeConn.asPromise();

  app = require('../../server');
  Employee = require('../models/Employee');

  employee = await Employee.create({
    fullName: 'AI Tester',
    email: 'aitester@co.com',
    password: 'password123',
    department: 'ENG',
    employeeId: 'AI_TEST_001',
    skills: [{ name: 'JavaScript', level: 'expert' }],
    githubUrl: 'https://github.com/octocat',
  });

  const payload = { id: employee._id.toString(), department: 'ENG' };
  token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await mockEmployeeConn.close();
  await mongoServer.stop();
  jest.resetModules();
});

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ai/chat', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: 'Hello' });
    expect(res.statusCode).toBe(401);
  });

  it('should reject an empty message', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '' });
    expect(res.statusCode).toBe(400);
  });

  it('should reject a message exceeding 2000 characters', async () => {
    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'x'.repeat(2001) });
    expect(res.statusCode).toBe(400);
  });

  it('should return a reply for a valid message', async () => {
    axios.post.mockResolvedValueOnce({ data: { reply: 'Great question! Focus on Node.js.' } });

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'What should I learn next?', session_id: 'sess-1' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toBe('Great question! Focus on Node.js.');
  });

  it('should handle AI service failure gracefully', async () => {
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Hello' });

    expect(res.statusCode).toBe(502);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/ai/github/scrape
// ─────────────────────────────────────────────────────────────────────────────

describe('POST /api/ai/github/scrape', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app).post('/api/ai/github/scrape');
    expect(res.statusCode).toBe(401);
  });

  it('should return 400 if employee has no githubUrl', async () => {
    // Create an employee with no githubUrl
    const emp2 = await Employee.create({
      fullName: 'No Github',
      email: 'nogithub@co.com',
      password: 'password123',
      department: 'ENG',
      employeeId: 'NO_GH_001',
    });
    const tok2 = jwt.sign({ id: emp2._id.toString(), department: 'ENG' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/ai/github/scrape')
      .set('Authorization', `Bearer ${tok2}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/No GitHub URL/i);
  });

  it('should return 422 if stored githubUrl is invalid', async () => {
    const emp3 = await Employee.create({
      fullName: 'Bad URL',
      email: 'badurl@co.com',
      password: 'password123',
      department: 'ENG',
      employeeId: 'BAD_URL_001',
      githubUrl: 'not-a-url',
    });
    const tok3 = jwt.sign({ id: emp3._id.toString(), department: 'ENG' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const res = await request(app)
      .post('/api/ai/github/scrape')
      .set('Authorization', `Bearer ${tok3}`);

    expect(res.statusCode).toBe(422);
    expect(res.body.message).toMatch(/invalid/i);
  });

  it('should merge new skills without duplicating existing ones', async () => {
    // AI returns Python (existing) and TypeScript (new)
    axios.post.mockResolvedValueOnce({
      data: {
        username: 'octocat',
        public_repos: 5,
        followers: 100,
        languages_detected: ['JavaScript', 'TypeScript'],
        top_repos: [],
      },
    });
    // Index call
    axios.post.mockResolvedValueOnce({ data: { ok: true } });

    const res = await request(app)
      .post('/api/ai/github/scrape')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.newSkillsAdded).not.toContain('JavaScript'); // Already exists
    expect(res.body.data.newSkillsAdded).toContain('TypeScript');    // New

    // Verify DB
    const updated = await Employee.findById(employee._id);
    const skillNames = updated.skills.map(s => s.name.toLowerCase());
    const jsCount = skillNames.filter(n => n === 'javascript').length;
    expect(jsCount).toBe(1); // No duplicate
    expect(skillNames).toContain('typescript');
  });

  it('should NOT overwrite existing skill proficiency level', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        username: 'octocat',
        public_repos: 5,
        followers: 100,
        languages_detected: ['JavaScript'], // Already at expert
        top_repos: [],
      },
    });

    await request(app)
      .post('/api/ai/github/scrape')
      .set('Authorization', `Bearer ${token}`);

    const updated = await Employee.findById(employee._id);
    const jsSkill = updated.skills.find(s => s.name.toLowerCase() === 'javascript');
    expect(jsSkill.level).toBe('expert'); // Should NOT have been downgraded to 'beginner'
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ai/market-skills
// ─────────────────────────────────────────────────────────────────────────────

describe('GET /api/ai/market-skills', () => {
  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/ai/market-skills');
    expect(res.statusCode).toBe(401);
  });

  it('should return market skills with a disclaimer', async () => {
    axios.post.mockResolvedValueOnce({
      data: {
        department: 'ENG',
        top_skills: [{ skill: 'Kubernetes', already_have: false, why_in_demand: 'DevOps', learn_from: 'Udemy' }],
        disclaimer: 'AI-generated estimates.',
      },
    });

    const res = await request(app)
      .get('/api/ai/market-skills')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.marketSkills.top_skills).toHaveLength(1);
    expect(res.body.data.marketSkills.disclaimer).toBeDefined();
  });
});
