/**
 * seed.js — Demo data loader for SkillSphere hackathon demo
 *
 * Creates:
 *   • 1 HR Admin account
 *   • 5 Job openings (one per department)
 *   • 20 Employees spread across all departments
 *   • 6 Assessments in various states (upcoming, completed+accepted, completed+rejected, pending review)
 *
 * Run:  npm run seed
 *       (or: node scripts/seed.js)
 *
 * ⚠️  Wipes existing HRAdmin, Job, Assessment, and Employee collections first.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const HRAdmin    = require("../src/models/HRAdmin");
const Job        = require("../src/models/Job");
const Assessment = require("../src/models/Assessment");
const Employee   = require("../src/models/Employee");

// ── Helpers ───────────────────────────────────────────────────────────────────

const hash = (pw) => bcrypt.hashSync(pw, 10);

const daysFromNow = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

const daysAgo = (n) => daysFromNow(-n);

// ── HR Admin ──────────────────────────────────────────────────────────────────

const HR_ADMIN = {
  fullName: "Sarah Mitchell",
  email:    "hr@skillsphere.dev",
  password: hash("Admin@123"),
  role:     "hr",
};

// ── Jobs ──────────────────────────────────────────────────────────────────────

const JOBS = [
  {
    title:          "Senior Full-Stack Engineer",
    department:     "ENG",
    employmentType: "Full-time",
    workMode:       "Hybrid",
    location:       "Bangalore",
    requiredSkills: ["React", "Node.js", "MongoDB", "AWS", "Docker", "TypeScript"],
    minExperience:  4,
    jdText: `We are looking for a Senior Full-Stack Engineer to join our growing engineering team.
You will design and build scalable web applications, lead technical decisions, and mentor junior developers.

Responsibilities:
- Architect and implement full-stack features using React (frontend) and Node.js/Express (backend)
- Design MongoDB schemas optimised for performance
- Containerise services with Docker and deploy on AWS (EC2, S3, Lambda)
- Write clean, well-tested TypeScript code with 80%+ test coverage
- Collaborate with product and design teams in agile sprints
- Conduct thorough code reviews and maintain engineering standards

Requirements:
- 4+ years experience in full-stack development
- Expert-level React.js and Node.js
- Strong understanding of RESTful API design and GraphQL
- Hands-on AWS experience (EC2, S3, RDS, Lambda)
- Docker and CI/CD pipeline experience (GitHub Actions / Jenkins)
- TypeScript proficiency
- Excellent communication and problem-solving skills`,
    matchStats: { fitCount: 7, unfitCount: 8, lastAnalyzed: daysAgo(1) },
  },
  {
    title:          "HR Business Partner",
    department:     "HR",
    employmentType: "Full-time",
    workMode:       "On-site",
    location:       "Mumbai",
    requiredSkills: ["HRIS", "Talent Acquisition", "L&D", "Employee Relations", "SHRM"],
    minExperience:  3,
    jdText: `We are seeking an experienced HR Business Partner to act as a strategic advisor to our
business units and drive people initiatives across the organisation.

Responsibilities:
- Partner with department heads to understand business needs and align HR strategy
- Lead end-to-end talent acquisition for mid to senior roles
- Design and deliver Learning & Development (L&D) programmes
- Manage employee relations, handle grievances, and ensure policy compliance
- Analyse HR metrics (attrition, eNPS, time-to-hire) and present insights to leadership
- Drive performance review cycles and succession planning

Requirements:
- 3+ years as an HRBP or senior HR generalist
- Experience with HRIS platforms (Workday, BambooHR, or equivalent)
- Strong knowledge of labour law and compliance
- Excellent stakeholder management skills
- SHRM-CP or SHRM-SCP certification preferred
- Data-driven mindset with Excel/Power BI skills`,
    matchStats: { fitCount: 3, unfitCount: 2, lastAnalyzed: daysAgo(2) },
  },
  {
    title:          "Financial Analyst",
    department:     "FIN",
    employmentType: "Full-time",
    workMode:       "Hybrid",
    location:       "Hyderabad",
    requiredSkills: ["Financial Modelling", "Excel", "Power BI", "SQL", "FP&A", "GAAP"],
    minExperience:  2,
    jdText: `We are looking for a detail-oriented Financial Analyst to support our Finance & Planning team.
You will build financial models, track KPIs, and help drive data-driven business decisions.

Responsibilities:
- Build and maintain complex financial models for budgeting, forecasting, and variance analysis
- Prepare monthly MIS reports and present to CFO and leadership team
- Analyse revenue, cost, and margin trends across business units
- Partner with engineering and operations on capex/opex planning
- Support annual budget cycle and quarterly rolling forecasts
- Ensure compliance with GAAP and internal audit requirements

Requirements:
- 2+ years in FP&A, corporate finance, or investment analysis
- Advanced Excel (pivot tables, Power Query, VBA preferred)
- Power BI or Tableau for dashboards
- SQL for pulling and transforming financial data
- Strong understanding of P&L, balance sheet, and cash flow statements
- CA / CFA / MBA (Finance) preferred`,
    matchStats: { fitCount: 2, unfitCount: 3, lastAnalyzed: daysAgo(3) },
  },
  {
    title:          "Product Manager — Platform",
    department:     "MGMT",
    employmentType: "Full-time",
    workMode:       "Remote",
    location:       "Pan India",
    requiredSkills: ["Product Strategy", "Roadmapping", "Agile", "OKRs", "SQL", "Figma", "Stakeholder Management"],
    minExperience:  5,
    jdText: `We are hiring a Product Manager for our core platform team to own the product vision,
roadmap, and delivery for our B2B SaaS product.

Responsibilities:
- Define and own the product roadmap aligned with company OKRs
- Collaborate with engineering, design, and go-to-market teams
- Run discovery: user interviews, competitive analysis, data analysis
- Write clear PRDs and user stories for engineering
- Monitor product metrics (DAU, retention, NPS) and drive improvements
- Manage stakeholder expectations across leadership and customers

Requirements:
- 5+ years in product management, preferably in B2B SaaS
- Strong analytical skills — comfortable with SQL and product analytics tools (Mixpanel, Amplitude)
- Experience with Agile / Scrum methodologies
- Excellent communication and presentation skills
- Figma for wireframing and collaboration with design
- Track record of shipping 0-to-1 and scale products`,
    matchStats: { fitCount: 1, unfitCount: 4, lastAnalyzed: daysAgo(1) },
  },
  {
    title:          "Senior UI/UX Designer",
    department:     "DESIGN",
    employmentType: "Full-time",
    workMode:       "Hybrid",
    location:       "Pune",
    requiredSkills: ["Figma", "User Research", "Design Systems", "Prototyping", "Accessibility", "Motion Design"],
    minExperience:  3,
    jdText: `We are looking for a Senior UI/UX Designer to lead design across our web and mobile products.
You will shape the end-to-end user experience and build scalable design systems.

Responsibilities:
- Lead UX research (user interviews, usability testing, heuristic evaluation)
- Create wireframes, high-fidelity mockups, and interactive prototypes in Figma
- Build and maintain a comprehensive design system (components, tokens, documentation)
- Collaborate with engineers to ensure pixel-perfect implementation
- Champion accessibility (WCAG 2.1 AA) across all products
- Mentor junior designers and drive design culture

Requirements:
- 3+ years as a UX/UI designer on digital products
- Mastery of Figma (auto-layout, variants, dev mode, prototyping)
- Experience building and maintaining design systems
- Strong understanding of WCAG accessibility standards
- Motion design / micro-interactions experience (Framer, Lottie) a plus
- Portfolio demonstrating research-driven, problem-solving design process`,
    matchStats: { fitCount: 2, unfitCount: 2, lastAnalyzed: daysAgo(2) },
  },
];

// ── Employees ─────────────────────────────────────────────────────────────────

const EMPLOYEES = [
  // ── Engineering (8 employees) ─────────────────────────────────────────────
  {
    fullName: "Arjun Sharma",
    email:    "arjun.sharma@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Bangalore",
    bio: "Passionate full-stack engineer with 6 years of experience building scalable SaaS products.",
    linkedinUrl: "https://linkedin.com/in/arjunsharma",
    githubUrl:   "https://github.com/arjunsharma",
    skills: [
      { name: "React",      proficiency: "Expert" },
      { name: "Node.js",    proficiency: "Expert" },
      { name: "MongoDB",    proficiency: "Expert" },
      { name: "AWS",        proficiency: "Intermediate" },
      { name: "Docker",     proficiency: "Intermediate" },
      { name: "TypeScript", proficiency: "Expert" },
      { name: "GraphQL",    proficiency: "Intermediate" },
    ],
    hiddenSkills: ["System Design", "Technical Mentoring"],
    experience: [
      { company: "TechCorp India", jobTitle: "Senior Engineer", duration: "2021–Present",
        responsibilities: "Led a team of 5 engineers, architected microservices platform",
        technologiesUsed: ["React", "Node.js", "MongoDB", "Docker"] },
      { company: "Startup XYZ", jobTitle: "Full-Stack Developer", duration: "2018–2021",
        responsibilities: "Built customer-facing features from scratch",
        technologiesUsed: ["React", "Express", "PostgreSQL"] },
    ],
    education: [{ degree: "B.Tech Computer Science", institution: "IIT Bombay", year: 2018, gpa: 8.9 }],
    profileComplete: true, completionPercent: 95, isVerified: true,
  },
  {
    fullName: "Priya Nair",
    email:    "priya.nair@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Bangalore",
    bio: "Backend-focused engineer with expertise in distributed systems and cloud-native architectures.",
    linkedinUrl: "https://linkedin.com/in/priyanair",
    githubUrl:   "https://github.com/priyanair",
    skills: [
      { name: "Node.js",    proficiency: "Expert" },
      { name: "AWS",        proficiency: "Expert" },
      { name: "Docker",     proficiency: "Expert" },
      { name: "Kubernetes", proficiency: "Intermediate" },
      { name: "TypeScript", proficiency: "Intermediate" },
      { name: "PostgreSQL", proficiency: "Expert" },
      { name: "React",      proficiency: "Beginner" },
    ],
    hiddenSkills: ["DevOps", "Cloud Architecture"],
    experience: [
      { company: "CloudBase Inc.", jobTitle: "Backend Engineer", duration: "2020–Present",
        responsibilities: "Designed and scaled REST APIs serving 2M+ requests/day",
        technologiesUsed: ["Node.js", "AWS", "Docker", "Kubernetes"] },
    ],
    education: [{ degree: "M.Tech Computer Science", institution: "IIT Madras", year: 2020, gpa: 9.1 }],
    profileComplete: true, completionPercent: 88, isVerified: true,
  },
  {
    fullName: "Rahul Verma",
    email:    "rahul.verma@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Hyderabad",
    bio: "Frontend developer specialising in React and design systems.",
    skills: [
      { name: "React",      proficiency: "Expert" },
      { name: "TypeScript", proficiency: "Intermediate" },
      { name: "CSS",        proficiency: "Expert" },
      { name: "Node.js",    proficiency: "Beginner" },
    ],
    hiddenSkills: ["Accessibility", "Performance Optimisation"],
    experience: [
      { company: "PixelCraft", jobTitle: "Frontend Engineer", duration: "2022–Present",
        technologiesUsed: ["React", "TypeScript", "Tailwind CSS"] },
    ],
    education: [{ degree: "B.E. Information Technology", institution: "BITS Pilani", year: 2022, gpa: 8.2 }],
    profileComplete: true, completionPercent: 80, isVerified: true,
  },
  {
    fullName: "Sneha Patel",
    email:    "sneha.patel@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Pune",
    bio: "ML engineer with a focus on NLP and LLM applications.",
    skills: [
      { name: "Python",     proficiency: "Expert" },
      { name: "TensorFlow", proficiency: "Intermediate" },
      { name: "PyTorch",    proficiency: "Expert" },
      { name: "SQL",        proficiency: "Intermediate" },
      { name: "Docker",     proficiency: "Beginner" },
    ],
    hiddenSkills: ["LLM Fine-tuning", "Data Pipeline Design"],
    experience: [
      { company: "AI Ventures", jobTitle: "ML Engineer", duration: "2021–Present",
        technologiesUsed: ["Python", "PyTorch", "AWS SageMaker"] },
    ],
    education: [{ degree: "M.Tech AI", institution: "IISc Bangalore", year: 2021, gpa: 9.4 }],
    profileComplete: true, completionPercent: 90, isVerified: true,
  },
  {
    fullName: "Kiran Reddy",
    email:    "kiran.reddy@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Bangalore",
    bio: "Junior developer building foundational skills in full-stack development.",
    skills: [
      { name: "JavaScript", proficiency: "Intermediate" },
      { name: "React",      proficiency: "Beginner" },
      { name: "HTML/CSS",   proficiency: "Intermediate" },
      { name: "Python",     proficiency: "Beginner" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "FreelanceHub", jobTitle: "Junior Web Developer", duration: "2023–Present",
        technologiesUsed: ["JavaScript", "React", "HTML/CSS"] },
    ],
    education: [{ degree: "B.Sc Computer Science", institution: "Osmania University", year: 2023, gpa: 7.5 }],
    profileComplete: true, completionPercent: 65, isVerified: true,
  },
  {
    fullName: "Dev Malhotra",
    email:    "dev.malhotra@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Delhi",
    skills: [
      { name: "Java",       proficiency: "Expert" },
      { name: "Spring Boot",proficiency: "Expert" },
      { name: "AWS",        proficiency: "Intermediate" },
      { name: "MongoDB",    proficiency: "Intermediate" },
      { name: "Docker",     proficiency: "Intermediate" },
    ],
    hiddenSkills: ["Microservices Architecture"],
    experience: [
      { company: "Infosys", jobTitle: "Software Engineer", duration: "2019–Present",
        technologiesUsed: ["Java", "Spring Boot", "Oracle DB"] },
    ],
    education: [{ degree: "B.Tech CS", institution: "Delhi University", year: 2019, gpa: 8.0 }],
    profileComplete: true, completionPercent: 78, isVerified: true,
  },
  {
    fullName: "Anika Singh",
    email:    "anika.singh@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Bangalore",
    skills: [
      { name: "React",      proficiency: "Expert" },
      { name: "Node.js",    proficiency: "Expert" },
      { name: "MongoDB",    proficiency: "Expert" },
      { name: "AWS",        proficiency: "Expert" },
      { name: "Docker",     proficiency: "Expert" },
      { name: "TypeScript", proficiency: "Expert" },
      { name: "GraphQL",    proficiency: "Expert" },
      { name: "Redis",      proficiency: "Intermediate" },
    ],
    hiddenSkills: ["System Design", "Team Leadership", "Architecture"],
    experience: [
      { company: "Amazon India", jobTitle: "SDE-II", duration: "2019–Present",
        technologiesUsed: ["React", "Node.js", "AWS", "Docker"] },
      { company: "Flipkart",     jobTitle: "SDE-I",  duration: "2017–2019",
        technologiesUsed: ["React", "Java", "MongoDB"] },
    ],
    education: [{ degree: "B.Tech CS", institution: "IIT Delhi", year: 2017, gpa: 9.3 }],
    profileComplete: true, completionPercent: 97, isVerified: true,
  },
  {
    fullName: "Rohit Kumar",
    email:    "rohit.kumar@company.dev",
    password: hash("Employee@123"),
    department: "ENG",
    location: "Chennai",
    skills: [
      { name: "Python",     proficiency: "Intermediate" },
      { name: "JavaScript", proficiency: "Beginner" },
      { name: "SQL",        proficiency: "Intermediate" },
    ],
    hiddenSkills: [],
    experience: [],
    education: [{ degree: "B.E. CS", institution: "Anna University", year: 2024, gpa: 7.2 }],
    profileComplete: false, completionPercent: 40, isVerified: true,
  },

  // ── HR (3 employees) ──────────────────────────────────────────────────────
  {
    fullName: "Meera Krishnan",
    email:    "meera.krishnan@company.dev",
    password: hash("Employee@123"),
    department: "HR",
    location: "Mumbai",
    skills: [
      { name: "Talent Acquisition", proficiency: "Expert" },
      { name: "HRIS (Workday)",     proficiency: "Expert" },
      { name: "L&D",                proficiency: "Intermediate" },
      { name: "Employee Relations", proficiency: "Expert" },
      { name: "SHRM-CP",           proficiency: "Expert" },
      { name: "Power BI",           proficiency: "Beginner" },
    ],
    hiddenSkills: ["Culture Building", "Executive Coaching"],
    experience: [
      { company: "TCS", jobTitle: "Senior HRBP", duration: "2018–Present",
        technologiesUsed: ["Workday", "SuccessFactors"] },
    ],
    education: [{ degree: "MBA HR", institution: "XLRI Jamshedpur", year: 2018, gpa: 8.7 }],
    profileComplete: true, completionPercent: 92, isVerified: true,
  },
  {
    fullName: "Pooja Menon",
    email:    "pooja.menon@company.dev",
    password: hash("Employee@123"),
    department: "HR",
    location: "Bangalore",
    skills: [
      { name: "Recruitment",        proficiency: "Expert" },
      { name: "Employee Relations", proficiency: "Intermediate" },
      { name: "Excel",              proficiency: "Intermediate" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "Wipro", jobTitle: "HR Generalist", duration: "2021–Present",
        technologiesUsed: ["BambooHR", "Excel"] },
    ],
    education: [{ degree: "BBA HR", institution: "Symbiosis Pune", year: 2021, gpa: 8.0 }],
    profileComplete: true, completionPercent: 75, isVerified: true,
  },
  {
    fullName: "Sanjay Gupta",
    email:    "sanjay.gupta@company.dev",
    password: hash("Employee@123"),
    department: "HR",
    location: "Delhi",
    skills: [
      { name: "Payroll",            proficiency: "Expert" },
      { name: "Compliance",         proficiency: "Expert" },
      { name: "HRIS",               proficiency: "Intermediate" },
      { name: "Employee Relations", proficiency: "Beginner" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "Deloitte", jobTitle: "HR Operations Specialist", duration: "2019–Present",
        technologiesUsed: ["SAP HR", "Excel"] },
    ],
    education: [{ degree: "B.Com", institution: "Delhi University", year: 2019, gpa: 7.8 }],
    profileComplete: true, completionPercent: 70, isVerified: true,
  },

  // ── Finance (3 employees) ──────────────────────────────────────────────────
  {
    fullName: "Riya Desai",
    email:    "riya.desai@company.dev",
    password: hash("Employee@123"),
    department: "FIN",
    location: "Hyderabad",
    skills: [
      { name: "Financial Modelling", proficiency: "Expert" },
      { name: "Excel",               proficiency: "Expert" },
      { name: "Power BI",            proficiency: "Expert" },
      { name: "SQL",                 proficiency: "Intermediate" },
      { name: "FP&A",                proficiency: "Expert" },
      { name: "GAAP",                proficiency: "Expert" },
    ],
    hiddenSkills: ["Investor Relations", "M&A Analysis"],
    experience: [
      { company: "JP Morgan", jobTitle: "Financial Analyst", duration: "2020–Present",
        technologiesUsed: ["Excel", "Bloomberg", "Power BI"] },
    ],
    education: [{ degree: "MBA Finance", institution: "IIM Ahmedabad", year: 2020, gpa: 9.0 }],
    profileComplete: true, completionPercent: 93, isVerified: true,
  },
  {
    fullName: "Amit Joshi",
    email:    "amit.joshi@company.dev",
    password: hash("Employee@123"),
    department: "FIN",
    location: "Mumbai",
    skills: [
      { name: "Excel",    proficiency: "Intermediate" },
      { name: "Tally",    proficiency: "Expert" },
      { name: "GAAP",     proficiency: "Intermediate" },
      { name: "Taxation", proficiency: "Expert" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "KPMG", jobTitle: "Accounts Executive", duration: "2021–Present",
        technologiesUsed: ["Tally", "SAP FI"] },
    ],
    education: [{ degree: "B.Com Accounting", institution: "Mumbai University", year: 2021, gpa: 8.1 }],
    profileComplete: true, completionPercent: 72, isVerified: true,
  },
  {
    fullName: "Nisha Agarwal",
    email:    "nisha.agarwal@company.dev",
    password: hash("Employee@123"),
    department: "FIN",
    location: "Hyderabad",
    skills: [
      { name: "Financial Modelling", proficiency: "Intermediate" },
      { name: "Excel",               proficiency: "Intermediate" },
      { name: "SQL",                 proficiency: "Beginner" },
      { name: "Forecasting",         proficiency: "Intermediate" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "Cognizant", jobTitle: "Junior Analyst", duration: "2022–Present",
        technologiesUsed: ["Excel", "SAP"] },
    ],
    education: [{ degree: "B.Sc Finance", institution: "Hyderabad University", year: 2022, gpa: 7.9 }],
    profileComplete: true, completionPercent: 68, isVerified: true,
  },

  // ── Management (3 employees) ───────────────────────────────────────────────
  {
    fullName: "Vikram Bose",
    email:    "vikram.bose@company.dev",
    password: hash("Employee@123"),
    department: "MGMT",
    location: "Bangalore",
    skills: [
      { name: "Product Strategy",      proficiency: "Expert" },
      { name: "Roadmapping",           proficiency: "Expert" },
      { name: "Agile / Scrum",         proficiency: "Expert" },
      { name: "OKRs",                  proficiency: "Expert" },
      { name: "SQL",                   proficiency: "Intermediate" },
      { name: "Figma",                 proficiency: "Intermediate" },
      { name: "Stakeholder Management",proficiency: "Expert" },
    ],
    hiddenSkills: ["0-to-1 Product Building", "Data Analytics"],
    experience: [
      { company: "Swiggy", jobTitle: "Product Manager", duration: "2018–Present",
        technologiesUsed: ["Figma", "Amplitude", "Jira"] },
    ],
    education: [{ degree: "MBA", institution: "IIM Bangalore", year: 2018, gpa: 9.1 }],
    profileComplete: true, completionPercent: 96, isVerified: true,
  },
  {
    fullName: "Tanya Kapoor",
    email:    "tanya.kapoor@company.dev",
    password: hash("Employee@123"),
    department: "MGMT",
    location: "Delhi",
    skills: [
      { name: "Project Management", proficiency: "Expert" },
      { name: "Agile",              proficiency: "Intermediate" },
      { name: "Excel",              proficiency: "Intermediate" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "IBM", jobTitle: "Project Manager", duration: "2020–Present",
        technologiesUsed: ["Jira", "Confluence", "MS Project"] },
    ],
    education: [{ degree: "B.Tech + MBA", institution: "VIT Vellore", year: 2020, gpa: 8.3 }],
    profileComplete: true, completionPercent: 76, isVerified: true,
  },
  {
    fullName: "Anand Pillai",
    email:    "anand.pillai@company.dev",
    password: hash("Employee@123"),
    department: "MGMT",
    location: "Chennai",
    skills: [
      { name: "Operations Management", proficiency: "Expert" },
      { name: "Six Sigma",             proficiency: "Expert" },
      { name: "Data Analysis",         proficiency: "Intermediate" },
    ],
    hiddenSkills: ["Process Optimisation"],
    experience: [
      { company: "HCL", jobTitle: "Operations Lead", duration: "2017–Present",
        technologiesUsed: ["Excel", "Tableau", "Power BI"] },
    ],
    education: [{ degree: "B.E. Mechanical", institution: "NIT Trichy", year: 2017, gpa: 8.6 }],
    profileComplete: true, completionPercent: 82, isVerified: true,
  },

  // ── Design (3 employees) ───────────────────────────────────────────────────
  {
    fullName: "Lavanya Iyer",
    email:    "lavanya.iyer@company.dev",
    password: hash("Employee@123"),
    department: "DESIGN",
    location: "Pune",
    skills: [
      { name: "Figma",          proficiency: "Expert" },
      { name: "User Research",  proficiency: "Expert" },
      { name: "Design Systems", proficiency: "Expert" },
      { name: "Prototyping",    proficiency: "Expert" },
      { name: "Accessibility",  proficiency: "Intermediate" },
      { name: "Motion Design",  proficiency: "Intermediate" },
    ],
    hiddenSkills: ["Brand Strategy", "Design Leadership"],
    experience: [
      { company: "Zomato", jobTitle: "Senior Product Designer", duration: "2019–Present",
        technologiesUsed: ["Figma", "Principle", "Lottie"] },
    ],
    education: [{ degree: "B.Des", institution: "NID Ahmedabad", year: 2019, gpa: 9.0 }],
    profileComplete: true, completionPercent: 94, isVerified: true,
  },
  {
    fullName: "Simran Kaur",
    email:    "simran.kaur@company.dev",
    password: hash("Employee@123"),
    department: "DESIGN",
    location: "Bangalore",
    skills: [
      { name: "Figma",          proficiency: "Expert" },
      { name: "Prototyping",    proficiency: "Intermediate" },
      { name: "Illustration",   proficiency: "Expert" },
      { name: "User Research",  proficiency: "Beginner" },
    ],
    hiddenSkills: ["Brand Identity"],
    experience: [
      { company: "OYO", jobTitle: "UI Designer", duration: "2021–Present",
        technologiesUsed: ["Figma", "Adobe Illustrator"] },
    ],
    education: [{ degree: "B.Des Communication Design", institution: "MIT Pune", year: 2021, gpa: 8.4 }],
    profileComplete: true, completionPercent: 79, isVerified: true,
  },
  {
    fullName: "Farhan Sheikh",
    email:    "farhan.sheikh@company.dev",
    password: hash("Employee@123"),
    department: "DESIGN",
    location: "Pune",
    skills: [
      { name: "Figma",         proficiency: "Intermediate" },
      { name: "Adobe XD",      proficiency: "Expert" },
      { name: "Photoshop",     proficiency: "Expert" },
      { name: "User Research", proficiency: "Beginner" },
    ],
    hiddenSkills: [],
    experience: [
      { company: "Agency X", jobTitle: "Graphic Designer", duration: "2022–Present",
        technologiesUsed: ["Photoshop", "Illustrator", "Adobe XD"] },
    ],
    education: [{ degree: "B.Des", institution: "Srishti Bangalore", year: 2022, gpa: 7.9 }],
    profileComplete: true, completionPercent: 71, isVerified: true,
  },
];

// ── Sample MCQ questions (reused across assessments) ──────────────────────────

const SAMPLE_QUESTIONS = Array.from({ length: 30 }, (_, i) => ({
  question:      `Sample Question ${i + 1}: What is the best practice for ${["REST API design", "MongoDB indexing", "React state management", "AWS security", "Docker networking"][i % 5]}?`,
  options:       { A: "Option A", B: "Option B", C: "Option C", D: "Option D" },
  correctAnswer: ["A", "B", "C", "D"][i % 4],
}));

const SAMPLE_ANSWERS_GOOD = SAMPLE_QUESTIONS.map((q, i) => ({
  questionIndex:  i,
  selectedAnswer: i < 27 ? q.correctAnswer : (q.correctAnswer === "A" ? "B" : "A"), // 27/30 correct
}));

const SAMPLE_ANSWERS_POOR = SAMPLE_QUESTIONS.map((q, i) => ({
  questionIndex:  i,
  selectedAnswer: i < 15 ? q.correctAnswer : (q.correctAnswer === "A" ? "B" : "A"), // 15/30 correct
}));

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✅  Connected to MongoDB");

  // ── Wipe existing data ───────────────────────────────────────────────────
  await Promise.all([
    HRAdmin.deleteMany({}),
    Job.deleteMany({}),
    Assessment.deleteMany({}),
    Employee.deleteMany({}),
  ]);
  console.log("🗑️   Cleared existing HR admin, jobs, assessments, employees");

  // ── Create HR Admin ──────────────────────────────────────────────────────
  const hrAdmin = await HRAdmin.create(HR_ADMIN);
  console.log(`👤  HR Admin created: ${hrAdmin.email}`);

  // ── Create Jobs ──────────────────────────────────────────────────────────
  const jobs = await Job.insertMany(
    JOBS.map((j) => ({ ...j, postedBy: hrAdmin._id }))
  );
  console.log(`💼  Jobs created: ${jobs.map((j) => j.title).join(", ")}`);

  // ── Create Employees ─────────────────────────────────────────────────────
  const employees = await Employee.insertMany(EMPLOYEES);
  console.log(`👥  Employees created: ${employees.length}`);

  // ── Map names to IDs for easy reference ──────────────────────────────────
  const empByName = Object.fromEntries(employees.map((e) => [e.fullName, e]));
  const jobByTitle = Object.fromEntries(jobs.map((j) => [j.title, j]));

  // ── Create Assessments ───────────────────────────────────────────────────
  const engJob  = jobByTitle["Senior Full-Stack Engineer"];
  const hrJob   = jobByTitle["HR Business Partner"];
  const finJob  = jobByTitle["Financial Analyst"];

  const assessments = [
    // 1. Upcoming — Arjun for Senior Full-Stack Engineer
    {
      jobId:         engJob._id,
      employeeId:    empByName["Arjun Sharma"]._id,
      scheduledDate: daysFromNow(6),
      scheduledTime: "10:00 AM",
      duration:      30,
      status:        "upcoming",
      questions:     SAMPLE_QUESTIONS,
      hrAction:      "pending",
      notifiedEmployee: true,
    },
    // 2. Upcoming — Anika for Senior Full-Stack Engineer
    {
      jobId:         engJob._id,
      employeeId:    empByName["Anika Singh"]._id,
      scheduledDate: daysFromNow(8),
      scheduledTime: "02:00 PM",
      duration:      30,
      status:        "upcoming",
      questions:     SAMPLE_QUESTIONS,
      hrAction:      "pending",
      notifiedEmployee: true,
    },
    // 3. Completed + Accepted — Priya for Senior Full-Stack Engineer (great score)
    {
      jobId:            engJob._id,
      employeeId:       empByName["Priya Nair"]._id,
      scheduledDate:    daysAgo(3),
      scheduledTime:    "11:00 AM",
      duration:         30,
      status:           "completed",
      questions:        SAMPLE_QUESTIONS,
      submittedAnswers: SAMPLE_ANSWERS_GOOD,
      score:            27,
      percentage:       90,
      aiSummary:        "Priya demonstrated excellent backend and cloud engineering skills, scoring 90%. Her strongest area was AWS and containerisation, answering all related questions correctly. She is recommended for acceptance, with minor improvement suggested in GraphQL advanced patterns.",
      hrAction:         "accepted",
      hrFeedback:       "Outstanding performance! Strong AWS expertise and solid Node.js fundamentals. Welcome to the team — HR will follow up shortly.",
      notifiedEmployee: true,
    },
    // 4. Completed + Rejected — Kiran for Senior Full-Stack Engineer (low score)
    {
      jobId:            engJob._id,
      employeeId:       empByName["Kiran Reddy"]._id,
      scheduledDate:    daysAgo(5),
      scheduledTime:    "03:00 PM",
      duration:         30,
      status:           "completed",
      questions:        SAMPLE_QUESTIONS,
      submittedAnswers: SAMPLE_ANSWERS_POOR,
      score:            15,
      percentage:       50,
      aiSummary:        "Kiran scored 50%, below the required threshold for a senior role. JavaScript fundamentals showed competency but gaps in AWS, Docker, and system design were evident. Recommend revisiting cloud and backend technologies before reapplying.",
      hrAction:         "rejected",
      hrFeedback:       "Strong in JavaScript basics but the role requires deeper AWS and backend experience. We encourage you to upskill and apply again — we see potential!",
      notifiedEmployee: true,
    },
    // 5. Completed + Pending HR action — Meera for HR Business Partner
    {
      jobId:            hrJob._id,
      employeeId:       empByName["Meera Krishnan"]._id,
      scheduledDate:    daysAgo(1),
      scheduledTime:    "10:30 AM",
      duration:         30,
      status:           "completed",
      questions:        SAMPLE_QUESTIONS,
      submittedAnswers: SAMPLE_ANSWERS_GOOD,
      score:            25,
      percentage:       83,
      aiSummary:        "Meera scored 83%, showing strong HR domain knowledge. Talent acquisition and HRBP competencies were outstanding. Minor gaps in data analytics and Power BI usage were noted. Overall a strong candidate.",
      hrAction:         "pending",
      notifiedEmployee: false,
    },
    // 6. Completed + Pending HR action — Riya for Financial Analyst
    {
      jobId:            finJob._id,
      employeeId:       empByName["Riya Desai"]._id,
      scheduledDate:    daysAgo(2),
      scheduledTime:    "01:00 PM",
      duration:         30,
      status:           "completed",
      questions:        SAMPLE_QUESTIONS,
      submittedAnswers: SAMPLE_ANSWERS_GOOD,
      score:            28,
      percentage:       93,
      aiSummary:        "Riya achieved an exceptional 93% score, demonstrating mastery of financial modelling, GAAP, and FP&A processes. All scenario-based questions were answered correctly. Highly recommended for acceptance — top candidate for this role.",
      hrAction:         "pending",
      notifiedEmployee: false,
    },
  ];

  await Assessment.insertMany(assessments);
  console.log(`📋  Assessments created: ${assessments.length}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log("\n══════════════════════════════════════════");
  console.log("  ✅  SEED COMPLETE");
  console.log("══════════════════════════════════════════");
  console.log("\n  🔑  HR Admin Login:");
  console.log(`       Email   : ${HR_ADMIN.email}`);
  console.log(`       Password: Admin@123`);
  console.log("\n  📊  Data Summary:");
  console.log(`       HR Admins   : 1`);
  console.log(`       Jobs        : ${jobs.length}  (one per department)`);
  console.log(`       Employees   : ${employees.length} (ENG×8, HR×3, FIN×3, MGMT×3, DESIGN×3)`);
  console.log(`       Assessments : ${assessments.length}`);
  console.log("         • 2 upcoming");
  console.log("         • 1 completed + accepted");
  console.log("         • 1 completed + rejected");
  console.log("         • 2 completed + pending HR review");
  console.log("\n  🚀  Backend : npm run dev  (port 5000)");
  console.log("  🤖  AI Svc  : python run.py  (port 8000)");
  console.log("══════════════════════════════════════════\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("❌  Seed failed:", err.message);
  process.exit(1);
});
