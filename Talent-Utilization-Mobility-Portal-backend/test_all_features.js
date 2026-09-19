/**
 * test_all_features.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-stack live feature test for SkillSphere Employee Backend.
 *
 * Tests every endpoint across ALL phases:
 *   Phase 1  – Auth (signup, login, verify)
 *   Phase 2  – Profile & Resume
 *   Phase 3  – Job Matching (fit / unfit / detail)
 *   Phase 4  – Gap Analysis
 *   Phase 5  – Assessments (list, detail, submit, result)
 *   Phase 6  – AI Chat, GitHub Scraper, Market Skills
 *   AI Svc   – Python FastAPI health + direct endpoints
 *
 * Run:  node test_all_features.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const http  = require('http');
const https = require('https');

// ── Config ────────────────────────────────────────────────────────────────────

const BACKEND = 'http://localhost:5000';
const AI_SVC  = 'http://localhost:8000';

// Unique test user so repeated runs don't collide
const TS         = Date.now();
const TEST_EMAIL  = `testuser_${TS}@skillsphere.dev`;
const TEST_PASS   = 'Test@12345';
const TEST_NAME   = 'SkillSphere Tester';
const TEST_DEPT   = 'ENG';
const TEST_EMPID  = `EMP-${TS}`;

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed = 0, failed = 0, skipped = 0;
const results = [];

function colour(code, text) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const green  = t => colour('32', t);
const red    = t => colour('31', t);
const yellow = t => colour('33', t);
const cyan   = t => colour('36', t);
const bold   = t => colour('1',  t);

function section(title) {
  console.log('\n' + cyan('━'.repeat(60)));
  console.log(bold(cyan(`  ${title}`)));
  console.log(cyan('━'.repeat(60)));
}

function pass(name, detail = '') {
  passed++;
  const msg = `  ${green('✔')}  ${name}` + (detail ? ` ${colour('90', detail)}` : '');
  console.log(msg);
  results.push({ name, status: 'PASS', detail });
}

function fail(name, detail = '') {
  failed++;
  const msg = `  ${red('✖')}  ${name}` + (detail ? ` ${colour('31', detail)}` : '');
  console.log(msg);
  results.push({ name, status: 'FAIL', detail });
}

function skip(name, reason = '') {
  skipped++;
  const msg = `  ${yellow('⊘')}  ${name}` + (reason ? ` ${colour('33', '(' + reason + ')')}` : '');
  console.log(msg);
  results.push({ name, status: 'SKIP', detail: reason });
}

/**
 * Generic HTTP request helper.
 * Returns { status, body } where body is parsed JSON if possible.
 */
function request(method, url, { body = null, token = null, timeoutMs = 20000 } = {}) {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(url);
    const lib      = parsed.protocol === 'https:' ? https : http;
    const payload  = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port,
      path:     parsed.pathname + parsed.search,
      method,
      headers:  {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
      },
    };

    const timer = setTimeout(() => reject(new Error(`Timeout: ${url}`)), timeoutMs);

    const req = lib.request(options, res => {
      let raw = '';
      res.on('data', chunk => (raw += chunk));
      res.on('end', () => {
        clearTimeout(timer);
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', err => { clearTimeout(timer); reject(err); });
    if (payload) req.write(payload);
    req.end();
  });
}

// ── Test helpers ──────────────────────────────────────────────────────────────

async function get(path, token)      { return request('GET',  BACKEND + path, { token }); }
async function post(path, body, tok) { return request('POST', BACKEND + path, { body, token: tok }); }
async function put(path, body, tok)  { return request('PUT',  BACKEND + path, { body, token: tok }); }
async function aiGet(path)           { return request('GET',  AI_SVC  + path); }
async function aiPost(path, body)    { return request('POST', AI_SVC  + path, { body }); }

// ── Main test runner ──────────────────────────────────────────────────────────

async function run() {
  console.log(bold('\n🚀 SkillSphere — Full Backend Feature Test'));
  console.log(`   Backend : ${BACKEND}`);
  console.log(`   AI Svc  : ${AI_SVC}`);
  console.log(`   Time    : ${new Date().toISOString()}\n`);

  let TOKEN = null;         // JWT after login
  let EMPLOYEE_ID = null;   // MongoDB _id of our test employee
  let JOB_ID = null;        // first job ID for downstream tests
  let ASSESS_ID = null;     // first assessment ID

  // ══════════════════════════════════════════════════════════════════════════
  // §0 — Backend Health
  // ══════════════════════════════════════════════════════════════════════════
  section('§0  Backend Health');
  try {
    const r = await get('/health');
    if (r.status === 200 && r.body.status === 'ok') pass('GET /health', `status=ok service=${r.body.service}`);
    else fail('GET /health', `status=${r.status}`);
  } catch (e) {
    fail('GET /health', e.message);
    console.log(red('\n  ⚠  Backend unreachable — all backend tests will fail.'));
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §1 — Auth
  // ══════════════════════════════════════════════════════════════════════════
  section('§1  Auth (Phase 1)');

  // 1a. Signup
  try {
    const r = await post('/api/employee/auth/signup', {
      fullName:   TEST_NAME,
      email:      TEST_EMAIL,
      password:   TEST_PASS,
      department: TEST_DEPT,
      employeeId: TEST_EMPID,
      otp:        '000000',
    });
    if (r.status === 201 && r.body.data?.token) {
      TOKEN = r.body.data.token;
      EMPLOYEE_ID = r.body.data?.employee?._id || r.body.data?._id;
      pass('POST /auth/signup', `employeeId=${EMPLOYEE_ID}`);
    } else {
      fail('POST /auth/signup', `status=${r.status} msg=${r.body?.message}`);
    }
  } catch (e) { fail('POST /auth/signup', e.message); }

  // 1b. Signup duplicate → should 409
  try {
    const r = await post('/api/employee/auth/signup', {
      fullName: TEST_NAME, email: TEST_EMAIL, password: TEST_PASS,
      department: TEST_DEPT, employeeId: TEST_EMPID, otp: '000000'
    });
    if (r.status === 409) pass('POST /auth/signup (duplicate → 409)');
    else fail('POST /auth/signup (duplicate)', `expected 409 got ${r.status}`);
  } catch (e) { fail('POST /auth/signup (duplicate)', e.message); }

  // 1c. Login
  try {
    const r = await post('/api/employee/auth/login', { email: TEST_EMAIL, password: TEST_PASS });
    if (r.status === 200 && r.body.data?.token) {
      TOKEN = r.body.data.token; // refresh
      EMPLOYEE_ID = EMPLOYEE_ID || r.body.data?.employee?._id;
      pass('POST /auth/login', 'token received');
    } else {
      fail('POST /auth/login', `status=${r.status} msg=${r.body?.message}`);
    }
  } catch (e) { fail('POST /auth/login', e.message); }

  // 1d. Wrong password → 401
  try {
    const r = await post('/api/employee/auth/login', { email: TEST_EMAIL, password: 'Wrong!!' });
    if (r.status === 401) pass('POST /auth/login (wrong password → 401)');
    else fail('POST /auth/login (wrong password)', `expected 401 got ${r.status}`);
  } catch (e) { fail('POST /auth/login (wrong password)', e.message); }

  // 1e. Verify token
  if (TOKEN) {
    try {
      const r = await get('/api/employee/auth/verify', TOKEN);
      if (r.status === 200 && r.body.data?.employee) pass('GET /auth/verify', `employee=${r.body.data.employee.email}`);
      else fail('GET /auth/verify', `status=${r.status}`);
    } catch (e) { fail('GET /auth/verify', e.message); }
  } else skip('GET /auth/verify', 'no token');

  // 1f. Verify without token → 401
  try {
    const r = await get('/api/employee/auth/verify');
    if (r.status === 401) pass('GET /auth/verify (no token → 401)');
    else fail('GET /auth/verify (no token)', `expected 401 got ${r.status}`);
  } catch (e) { fail('GET /auth/verify (no token)', e.message); }

  // ══════════════════════════════════════════════════════════════════════════
  // §2 — Profile
  // ══════════════════════════════════════════════════════════════════════════
  section('§2  Profile & Resume (Phase 2)');

  // 2a. Get profile
  if (TOKEN) {
    try {
      const r = await get('/api/employee/profile', TOKEN);
      if (r.status === 200 && r.body.data) pass('GET /profile', `email=${r.body.data.email}`);
      else fail('GET /profile', `status=${r.status}`);
    } catch (e) { fail('GET /profile', e.message); }

    // 2b. Update profile
    try {
      const r = await put('/api/employee/profile', {
        phone:       '+91-9876543210',
        location:    'Chennai, India',
        bio:         'Full-stack developer with 3 years of experience.',
        githubUrl:   'https://github.com/octocat',
        linkedinUrl: 'https://linkedin.com/in/testuser',
        skills: [
          { name: 'JavaScript', proficiency: 'Expert' },
          { name: 'React',      proficiency: 'Intermediate' },
          { name: 'Node.js',    proficiency: 'Expert' },
          { name: 'Python',     proficiency: 'Intermediate' },
          { name: 'MongoDB',    proficiency: 'Intermediate' },
        ],
        experience: [{
          company: 'TechCorp Ltd',
          jobTitle: 'Software Engineer',
          duration: 'Jan 2022 – Present',
          responsibilities: 'Developed REST APIs and React dashboards.',
          technologiesUsed: ['Node.js', 'React', 'MongoDB'],
        }],
        education: [{
          degree: 'B.E. Computer Science',
          institution: 'Anna University',
          year: 2021,
          gpa: 8.5,
        }],
      }, TOKEN);
      if (r.status === 200) pass('PUT /profile', 'profile updated');
      else fail('PUT /profile', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('PUT /profile', e.message); }

    // 2c. Profile completeness
    try {
      const r = await get('/api/employee/profile/complete', TOKEN);
      if (r.status === 200 && typeof r.body.data?.completeness === 'number') {
        pass('GET /profile/complete', `${r.body.data.completeness}% complete`);
      } else fail('GET /profile/complete', `status=${r.status} data=${JSON.stringify(r.body?.data)}`);
    } catch (e) { fail('GET /profile/complete', e.message); }

  } else {
    skip('GET /profile', 'no token');
    skip('PUT /profile', 'no token');
    skip('GET /profile/complete', 'no token');
  }

  // 2d. Resume upload (skipped — needs multipart/PDF)
  skip('POST /resume', 'multipart upload (requires PDF binary — skipped in CLI test)');

  // ══════════════════════════════════════════════════════════════════════════
  // §3 — Job Matching
  // ══════════════════════════════════════════════════════════════════════════
  section('§3  Job Matching (Phase 3)');

  if (TOKEN) {
    // 3a. Fit jobs
    try {
      const r = await get('/api/employee/jobs/fit', TOKEN);
      if (r.status === 200) {
        const jobs = r.body.data || [];
        JOB_ID = jobs[0]?._id || jobs[0]?.id || null;
        pass('GET /jobs/fit', `${jobs.length} fit job(s) returned`);
      } else fail('GET /jobs/fit', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('GET /jobs/fit', e.message); }

    // 3b. Unfit jobs
    try {
      const r = await get('/api/employee/jobs/unfit', TOKEN);
      if (r.status === 200) {
        const jobs = r.body.data || [];
        if (!JOB_ID && jobs.length > 0) JOB_ID = jobs[0]?._id || jobs[0]?.id;
        pass('GET /jobs/unfit', `${jobs.length} unfit job(s) returned`);
      } else fail('GET /jobs/unfit', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('GET /jobs/unfit', e.message); }

    // 3c. Job detail
    if (JOB_ID) {
      try {
        const r = await get(`/api/employee/jobs/${JOB_ID}`, TOKEN);
        if (r.status === 200 && r.body.data) pass(`GET /jobs/${JOB_ID}`, `title="${r.body.data.title || r.body.data.jobTitle}"`);
        else fail(`GET /jobs/:id`, `status=${r.status}`);
      } catch (e) { fail('GET /jobs/:id', e.message); }
    } else skip('GET /jobs/:id', 'no jobs in DB — seed some jobs first');

    // 3d. Invalid job id
    try {
      const r = await get('/api/employee/jobs/000000000000000000000000', TOKEN);
      if (r.status === 404) pass('GET /jobs/:id (not found → 404)');
      else fail('GET /jobs/:id (not found)', `expected 404 got ${r.status}`);
    } catch (e) { fail('GET /jobs/:id (not found)', e.message); }

  } else {
    skip('GET /jobs/fit',   'no token');
    skip('GET /jobs/unfit', 'no token');
    skip('GET /jobs/:id',   'no token');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §4 — Gap Analysis
  // ══════════════════════════════════════════════════════════════════════════
  section('§4  Gap Analysis (Phase 4)');

  if (TOKEN && JOB_ID) {
    try {
      const r = await get(`/api/employee/jobs/${JOB_ID}/gap`, TOKEN);
      if (r.status === 200 && r.body.data) {
        const d = r.body.data;
        pass(`GET /jobs/${JOB_ID}/gap`, `missing=${JSON.stringify(d.missingSkills || [])} roadmap=${!!d.roadmap}`);
      } else fail('GET /jobs/:id/gap', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('GET /jobs/:id/gap', e.message); }
  } else {
    skip('GET /jobs/:id/gap', !TOKEN ? 'no token' : 'no job found');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §5 — Assessments
  // ══════════════════════════════════════════════════════════════════════════
  section('§5  Assessments (Phase 5)');

  if (TOKEN) {
    // 5a. List my assessments
    try {
      const r = await get('/api/employee/assessments', TOKEN);
      if (r.status === 200) {
        const assessmentList = r.body.data?.all || r.body.data?.upcoming || [];
        ASSESS_ID = (r.body.data?.upcoming || []).find(a => a.status === 'upcoming')?._id || null;
        pass('GET /assessments', `${assessmentList.length} assessment(s) (upcoming=${r.body.data?.upcoming?.length || 0})`);
      } else fail('GET /assessments', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('GET /assessments', e.message); }

    if (ASSESS_ID) {
      // 5b. Get assessment detail (no answers)
      try {
        const r = await get(`/api/employee/assessments/${ASSESS_ID}`, TOKEN);
        if (r.status === 200 && r.body.data) {
          const qs = r.body.data.questions || [];
          // Security check: no correctAnswer in response
          const leaked = qs.some(q => q.correctAnswer !== undefined);
          if (!leaked) pass(`GET /assessments/${ASSESS_ID}`, `${qs.length} questions, no correctAnswer leaked ✔`);
          else fail(`GET /assessments/${ASSESS_ID}`, '⚠ correctAnswer LEAKED in response!');
        } else fail('GET /assessments/:id', `status=${r.status}`);
      } catch (e) { fail('GET /assessments/:id', e.message); }

      // 5c. Submit assessment
      try {
        const detail = await get(`/api/employee/assessments/${ASSESS_ID}`, TOKEN);
        const questions = detail.body.data?.questions || [];
        const answers = questions.map((_, i) => ({ questionIndex: i, selectedAnswer: 'A' }));

        const r = await post(`/api/employee/assessments/${ASSESS_ID}/submit`, { answers }, TOKEN);
        if (r.status === 200 && typeof r.body.data?.score === 'number') {
          pass(`POST /assessments/${ASSESS_ID}/submit`, `score=${r.body.data.score} pct=${r.body.data.percentage}%`);
        } else fail('POST /assessments/:id/submit', `status=${r.status} msg=${r.body?.message}`);
      } catch (e) { fail('POST /assessments/:id/submit', e.message); }

      // 5d. Re-submit (should 409 — already completed)
      try {
        const r = await post(`/api/employee/assessments/${ASSESS_ID}/submit`, { answers: [] }, TOKEN);
        if (r.status === 409) pass('POST /assessments/:id/submit (re-submit → 409)');
        else fail('POST /assessments/:id/submit (re-submit)', `expected 409 got ${r.status}`);
      } catch (e) { fail('POST /assessments/:id/submit (re-submit)', e.message); }

      // 5e. Get result
      try {
        const r = await get(`/api/employee/assessments/${ASSESS_ID}/result`, TOKEN);
        if (r.status === 200 && r.body.data) {
          pass(`GET /assessments/${ASSESS_ID}/result`, `hrAction=${r.body.data.hrAction}`);
        } else fail('GET /assessments/:id/result', `status=${r.status}`);
      } catch (e) { fail('GET /assessments/:id/result', e.message); }

    } else {
      skip('GET /assessments/:id',          'no upcoming assessment — HR needs to schedule one');
      skip('POST /assessments/:id/submit',  'no upcoming assessment');
      skip('GET /assessments/:id/result',   'no upcoming assessment');
    }

  } else {
    skip('GET /assessments',               'no token');
    skip('GET /assessments/:id',           'no token');
    skip('POST /assessments/:id/submit',   'no token');
    skip('GET /assessments/:id/result',    'no token');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §6 — AI Routes (via Backend proxy)
  // ══════════════════════════════════════════════════════════════════════════
  section('§6  AI Features via Backend Proxy (Phase 6)');

  if (TOKEN) {
    // 6a. AI Chat
    try {
      const r = await post('/api/ai/chat', {
        message:    'What skills should I improve to become a senior full-stack engineer?',
        session_id: `test-${TS}`,
      }, TOKEN);
      if (r.status === 200 && r.body.data?.reply) {
        pass('POST /api/ai/chat', `reply length=${r.body.data.reply.length} chars`);
      } else fail('POST /api/ai/chat', `status=${r.status} data=${JSON.stringify(r.body?.data)}`);
    } catch (e) { fail('POST /api/ai/chat', e.message); }

    // 6b. GitHub Scraper
    try {
      const r = await post('/api/ai/github/scrape', {}, TOKEN);
      if (r.status === 200 && r.body.data) {
        const gs = r.body.data.githubSummary;
        pass('POST /api/ai/github/scrape', `newSkills=${JSON.stringify(r.body.data.newSkillsAdded)}`);
      } else fail('POST /api/ai/github/scrape', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('POST /api/ai/github/scrape', e.message); }

    // 6c. Market Skills
    try {
      const r = await get('/api/ai/market-skills', TOKEN);
      if (r.status === 200 && r.body.data?.marketSkills) {
        const skills = r.body.data.marketSkills?.top_skills || [];
        pass('GET /api/ai/market-skills', `${skills.length} skills`);
      } else fail('GET /api/ai/market-skills', `status=${r.status} msg=${r.body?.message}`);
    } catch (e) { fail('GET /api/ai/market-skills', e.message); }

    // 6d. Chat validation — empty message → 400
    try {
      const r = await post('/api/ai/chat', { message: '' }, TOKEN);
      if (r.status === 400) pass('POST /api/ai/chat (empty message → 400)');
      else fail('POST /api/ai/chat (empty msg)', `expected 400 got ${r.status}`);
    } catch (e) { fail('POST /api/ai/chat (empty msg)', e.message); }

  } else {
    skip('POST /api/ai/chat',          'no token');
    skip('POST /api/ai/github/scrape', 'no token');
    skip('GET  /api/ai/market-skills', 'no token');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // §7 — Python AI Service (direct)
  // ══════════════════════════════════════════════════════════════════════════
  section('§7  Python AI Service — Direct Endpoints');

  // 7a. Health
  try {
    const r = await aiGet('/health');
    if (r.status === 200 && r.body.status === 'ok') pass('GET /health (AI svc)', `pinecone=${r.body.pinecone}`);
    else fail('GET /health (AI svc)', `status=${r.status}`);
  } catch (e) { fail('GET /health (AI svc)', e.message); }

  // 7b. Chat direct
  try {
    const r = await aiPost('/ai/chat', {
      message:     'What are the top 5 skills for a backend engineer in 2025?',
      session_id:  `direct-${TS}`,
      employee_id: EMPLOYEE_ID || 'test-employee',
    });
    if (r.status === 200 && r.body.reply) pass('POST /ai/chat (AI svc)', `${r.body.reply.slice(0,60)}…`);
    else fail('POST /ai/chat (AI svc)', `status=${r.status}`);
  } catch (e) { fail('POST /ai/chat (AI svc)', e.message); }

  // 7c. Market skills direct
  try {
    const r = await aiPost('/ai/market-skills', {
      department: 'ENG',
      current_skills: [
        { name: 'JavaScript', level: 'expert' },
        { name: 'Node.js',    level: 'expert' },
        { name: 'React',      level: 'intermediate' },
      ],
    });
    if (r.status === 200 && r.body.top_skills) pass('POST /ai/market-skills (AI svc)', `${r.body.top_skills.length} skills`);
    else fail('POST /ai/market-skills (AI svc)', `status=${r.status}`);
  } catch (e) { fail('POST /ai/market-skills (AI svc)', e.message); }

  // 7d. GitHub scrape direct
  try {
    const r = await aiPost('/ai/scrape-github', { github_url: 'https://github.com/octocat', employee_id: EMPLOYEE_ID || 'test' });
    if (r.status === 200) pass('POST /ai/scrape-github (AI svc)', `langs=${JSON.stringify(r.body.detected_languages?.slice(0,3))}`);
    else fail('POST /ai/scrape-github (AI svc)', `status=${r.status}`);
  } catch (e) { fail('POST /ai/scrape-github (AI svc)', e.message); }

  // 7e. Gap analysis direct
  if (JOB_ID && EMPLOYEE_ID) {
    try {
      const r = await aiPost('/ai/gap-analysis', {
        employee_skills:  ['JavaScript', 'React', 'Node.js'],
        required_skills:  ['Python', 'Docker', 'Kubernetes', 'React', 'Node.js'],
        employee_id:      EMPLOYEE_ID,
        job_id:           JOB_ID,
      });
      if (r.status === 200 && r.body.missing_skills) {
        pass('POST /ai/gap-analysis (AI svc)', `missing=${JSON.stringify(r.body.missing_skills)}`);
      } else fail('POST /ai/gap-analysis (AI svc)', `status=${r.status}`);
    } catch (e) { fail('POST /ai/gap-analysis (AI svc)', e.message); }
  } else skip('POST /ai/gap-analysis (AI svc)', 'no job found');

  // 7f. Score assessment direct
  try {
    const r = await aiPost('/ai/score-assessment', {
      questions: [
        { questionText: 'What is a closure in JavaScript?', correctAnswer: 'A' },
        { questionText: 'What does REST stand for?',        correctAnswer: 'B' },
      ],
      submittedAnswers: [
        { questionIndex: 0, selectedAnswer: 'A' },
        { questionIndex: 1, selectedAnswer: 'C' },
      ],
      percentage: 50,
    });
    if (r.status === 200 && r.body.summary) {
      pass('POST /ai/score-assessment (AI svc)', `summary="${r.body.summary?.slice(0,50)}…"`);
    } else fail('POST /ai/score-assessment (AI svc)', `status=${r.status}`);
  } catch (e) { fail('POST /ai/score-assessment (AI svc)', e.message); }

  // ══════════════════════════════════════════════════════════════════════════
  // §8 — Security / Edge Cases
  // ══════════════════════════════════════════════════════════════════════════
  section('§8  Security & Edge Cases');

  // 8a. Accessing protected route with no token → 401
  try {
    const r = await request('GET', BACKEND + '/api/employee/profile');
    if (r.status === 401) pass('GET /profile (no token → 401)');
    else fail('GET /profile (no token)', `expected 401 got ${r.status}`);
  } catch (e) { fail('GET /profile (no token)', e.message); }

  // 8b. Accessing protected route with invalid token → 401
  try {
    const r = await request('GET', BACKEND + '/api/employee/profile', { token: 'invalid.jwt.token' });
    if (r.status === 401) pass('GET /profile (invalid token → 401)');
    else fail('GET /profile (invalid token)', `expected 401 got ${r.status}`);
  } catch (e) { fail('GET /profile (invalid token)', e.message); }

  // 8c. Signup with invalid email → 422 / 400
  try {
    const r = await request('POST', BACKEND + '/api/employee/auth/signup', { body: {
      fullName: 'Bad User', email: 'not-an-email', password: 'pass123',
      department: 'ENG', employeeId: 'BAD-001',
    }});
    if (r.status === 400 || r.status === 422) pass('POST /auth/signup (invalid email → 400/422)');
    else fail('POST /auth/signup (invalid email)', `expected 400/422 got ${r.status}`);
  } catch (e) { fail('POST /auth/signup (invalid email)', e.message); }

  // 8d. Signup with short password → 400
  try {
    const r = await request('POST', BACKEND + '/api/employee/auth/signup', { body: {
      fullName: 'Bad User', email: `short_${TS}@test.com`, password: '123',
      department: 'ENG', employeeId: `BAD-${TS}`,
    }});
    if (r.status === 400 || r.status === 422) pass('POST /auth/signup (short password → 400)');
    else fail('POST /auth/signup (short password)', `expected 400 got ${r.status}`);
  } catch (e) { fail('POST /auth/signup (short password)', e.message); }

  // ══════════════════════════════════════════════════════════════════════════
  // Summary
  // ══════════════════════════════════════════════════════════════════════════
  const total = passed + failed + skipped;
  const bar   = `${'█'.repeat(Math.round((passed/total)*30))}${'░'.repeat(30 - Math.round((passed/total)*30))}`;

  console.log('\n' + cyan('═'.repeat(60)));
  console.log(bold('\n  TEST SUMMARY\n'));
  console.log(`  ${bar}  ${Math.round((passed/total)*100)}%\n`);
  console.log(`  ${green('PASSED')}  : ${bold(passed)}`);
  console.log(`  ${red('FAILED')}  : ${bold(failed)}`);
  console.log(`  ${yellow('SKIPPED')} : ${bold(skipped)}`);
  console.log(`  TOTAL   : ${bold(total)}`);
  console.log('\n' + cyan('═'.repeat(60)) + '\n');

  if (failed > 0) {
    console.log(bold(red('  Failed tests:\n')));
    results.filter(r => r.status === 'FAIL').forEach(r => {
      console.log(`  ${red('✖')}  ${r.name}`);
      if (r.detail) console.log(`     ${colour('90', r.detail)}`);
    });
    console.log('');
  }

  if (skipped > 0) {
    console.log(bold(yellow('  Skipped (need data/binary):\n')));
    results.filter(r => r.status === 'SKIP').forEach(r => {
      console.log(`  ${yellow('⊘')}  ${r.name}  ${colour('90', r.detail)}`);
    });
    console.log('');
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error(red('\nFatal error:'), err.message);
  process.exit(1);
});
