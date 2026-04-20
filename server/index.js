const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');
const { User, KPI } = require('./models');

dotenv.config();

// Ensure uploads directory exists
const fs = require('fs');
['uploads', 'uploads/policies', 'uploads/profiles'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const app = express();
const PORT = process.env.PORT || 5000;

const authRoutes = require('./routes/authRoutes');
const kpiRoutes = require('./routes/kpiRoutes');
const staffRoutes = require('./routes/staffRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const bonusRoutes = require('./routes/bonusRoutes');
const policyRoutes = require('./routes/policyRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const quantitativeRoutes = require('./routes/quantitativeRoutes');
const auditRoutes = require('./routes/auditRoutes');
const companyDataRoutes = require('./routes/companyDataRoutes');
const helmet = require('helmet');

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://polite-pebble-07dcc0400.7.azurestaticapps.net'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
// Serve uploaded files statically
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/kpis', kpiRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/bonuses', bonusRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/quantitative', quantitativeRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/company-data', companyDataRoutes);

app.get('/', (req, res) => {
  res.send('SEPES API is running');
});

const KPI_SEED = [
  { title: 'Total New Orders', description: 'Number of new business generated.', category: 'Quantitative', unit: 'Count', weight: 10, targetValue: 50 },
  { title: 'Net Profit', description: 'Financial impact and profitability of projects.', category: 'Quantitative', unit: 'Currency', weight: 15, targetValue: 10000 },
  { title: 'Average Order Value', description: 'Mean revenue generated per order.', category: 'Quantitative', unit: 'Currency', weight: 10, targetValue: 500 },
  { title: 'Return on Investment (ROI)', description: 'Efficiency and financial gain of resources.', category: 'Quantitative', unit: 'Percentage', weight: 10, targetValue: 120 },
  { title: 'Order Completion Rate', description: 'Percentage of successfully delivered orders.', category: 'Quantitative', unit: 'Percentage', weight: 10, targetValue: 95 },
  { title: 'On-Time Delivery Rate', description: 'Ability to meet project deadlines.', category: 'Quantitative', unit: 'Percentage', weight: 10, targetValue: 98 },
  { title: 'Cancellation Rate', description: 'Percentage of failed/cancelled tasks.', category: 'Quantitative', unit: 'Percentage', weight: 5, targetValue: 2 },
  { title: 'Average Response Time', description: 'Speed of communication with stakeholders.', category: 'Quantitative', unit: 'Hours', weight: 5, targetValue: 2 },
  { title: 'Customer Satisfaction Score', description: 'Direct ratings from clients (x/5).', category: 'Quantitative', unit: 'Score (1-5)', weight: 10, targetValue: 4.5 },
  { title: 'Repeat Customer Rate', description: 'Frequency of returning clients.', category: 'Quantitative', unit: 'Percentage', weight: 10, targetValue: 30 },
  { title: 'Achieving Project Deadlines', description: 'Consistently meets project deadlines and delivers tasks on time, demonstrating strong time management skills.', category: 'Qualitative', unit: 'Rating', weight: 10 },
  { title: 'Quality of Work Product', description: 'Produces high-quality work that is accurate, thorough, and meets expectations, contributing to overall project success.', category: 'Qualitative', unit: 'Rating', weight: 10 },
  { title: 'Communication & Collaboration', description: 'Effectively communicates ideas and information to team members and stakeholders, fostering a collaborative and productive work environment.', category: 'Qualitative', unit: 'Rating', weight: 10 },
  { title: 'Problem-Solving & Innovation', description: 'Identifies challenges proactively, analyzes complex situations, and develops creative, effective solutions, driving continuous improvement.', category: 'Qualitative', unit: 'Rating', weight: 10 },
  { title: 'Dispute Rate', description: 'Tasks resulting in formal complaints.', category: 'Quantitative', unit: 'Percentage', weight: 5, targetValue: 1 },
  { title: 'Disputes Converted to Satisfied', description: 'Problem-solving skills in conflicts.', category: 'Quantitative', unit: 'Count', weight: 5, targetValue: 5 },
  { title: 'Tips or Recognition', description: 'External positive feedback or rewards.', category: 'Quantitative', unit: 'Currency/Count', weight: 5, targetValue: 100 },
  { title: 'Adaptability & Learning', description: 'Adapts quickly to new technologies, processes, and changing priorities, demonstrating a strong willingness to learn and grow professionally.', category: 'Qualitative', unit: 'Rating', weight: 10 }
];

const EMPLOYEE_SEED = [
  { username: 'Admin',         email: 'admin@techznap.com',   password: 'Admin@123',    role: 'Admin',    position: 'System Administrator',   department: 'IT',          jobCategory: 'Full time', basicSalary: 5000, startDate: '2022-01-10' },
  { username: 'Sarah Williams',email: 'sarah@techznap.com',   password: 'Sarah@123',    role: 'HR',       position: 'HR Manager',              department: 'HR',          jobCategory: 'Full time', basicSalary: 4500, startDate: '2022-03-15', mobileNumber: '+94 71 234 5678', jobDescription: 'Manages HR operations, recruitment and performance reviews.', responsibilities: 'Recruitment, Payroll, Employee Relations' },
  { username: 'James Cooper',  email: 'james@techznap.com',   password: 'James@123',    role: 'Manager',  position: 'Operations Manager',      department: 'Operations',  jobCategory: 'Full time', basicSalary: 5500, startDate: '2021-06-01', mobileNumber: '+94 77 345 6789', jobDescription: 'Oversees daily operations and team performance.', responsibilities: 'Team Management, KPI Tracking, Client Relations' },
  { username: 'Amara Perera',  email: 'amara@techznap.com',   password: 'Amara@123',    role: 'Employee', position: 'Software Engineer',       department: 'IT',          jobCategory: 'Full time', basicSalary: 3800, startDate: '2023-02-20', mobileNumber: '+94 76 456 7890', jobDescription: 'Develops and maintains software solutions.', responsibilities: 'Frontend Development, Bug Fixes, Code Review' },
  { username: 'Nimal Fernando', email: 'nimal@techznap.com',  password: 'Nimal@123',    role: 'Employee', position: 'Sales Executive',         department: 'Sales',       jobCategory: 'Full time', basicSalary: 3200, startDate: '2023-05-10', mobileNumber: '+94 70 567 8901', jobDescription: 'Handles client acquisition and order management.', responsibilities: 'Lead Generation, Client Meetings, Order Processing' },
  { username: 'Lisa Mendis',   email: 'lisa@techznap.com',    password: 'Lisa@123',     role: 'Employee', position: 'Marketing Specialist',    department: 'Marketing',   jobCategory: 'Full time', basicSalary: 3400, startDate: '2023-07-01', mobileNumber: '+94 75 678 9012', jobDescription: 'Plans and executes marketing campaigns.', responsibilities: 'Social Media, Content Creation, Campaign Analytics' },
  { username: 'David Silva',   email: 'david@techznap.com',   password: 'David@123',    role: 'Employee', position: 'Customer Support Lead',   department: 'Support',     jobCategory: 'Full time', basicSalary: 3000, startDate: '2022-11-15', mobileNumber: '+94 72 789 0123', jobDescription: 'Leads the customer support team and resolves escalations.', responsibilities: 'Ticket Management, Customer Satisfaction, Team Training' },
  { username: 'Emma Jayasinghe',email: 'emma@techznap.com',   password: 'Emma@123',     role: 'Employee', position: 'Finance Analyst',         department: 'Finance',     jobCategory: 'Full time', basicSalary: 4000, startDate: '2022-08-22', mobileNumber: '+94 78 890 1234', jobDescription: 'Analyses financial data and prepares reports.', responsibilities: 'Financial Reporting, Budget Analysis, Compliance' },
  { username: 'Kamal Bandara', email: 'kamal@techznap.com',   password: 'Kamal@123',    role: 'Employee', position: 'Delivery Coordinator',    department: 'Operations',  jobCategory: 'Hourly',    basicSalary: 2500, startDate: '2023-09-05', mobileNumber: '+94 71 901 2345', jobDescription: 'Coordinates deliveries and manages logistics.', responsibilities: 'Delivery Scheduling, Driver Coordination, Route Planning' },
  { username: 'CEO',           email: 'ceo@techznap.com',     password: 'Ceo@123',      role: 'CEO',      position: 'Chief Executive Officer', department: 'Executive',   jobCategory: 'Full time', basicSalary: 10000, startDate: '2020-01-01', mobileNumber: '+94 77 000 0001', jobDescription: 'Leads the company strategy and overall operations.', responsibilities: 'Strategic Planning, Stakeholder Management, Business Growth' },
];

async function seedDatabase() {
  const bcrypt = require('bcryptjs');

  // Seed users (idempotent - uses findOrCreate by email)
  let seededCount = 0;
  for (const emp of EMPLOYEE_SEED) {
    const hash = await bcrypt.hash(emp.password, 10);
    const [, created] = await User.findOrCreate({
      where: { email: emp.email },
      defaults: {
        username: emp.username,
        password: hash,
        role: emp.role,
        status: 'Active',
        jobCategory: emp.jobCategory,
        position: emp.position,
        department: emp.department,
        basicSalary: emp.basicSalary,
        mobileNumber: emp.mobileNumber || null,
        jobDescription: emp.jobDescription || '',
        responsibilities: emp.responsibilities || '',
        startDate: emp.startDate
      }
    });
    if (created) seededCount++;
  }
  if (seededCount > 0) console.log(`Seeded ${seededCount} users`);

  // Seed KPIs (idempotent)
  let seededKpiCount = 0;
  for (const kpi of KPI_SEED) {
    const [savedKpi, created] = await KPI.findOrCreate({ where: { title: kpi.title }, defaults: kpi });
    if (created) seededKpiCount++;
    else {
      const needsUpdate = Object.keys(kpi).some(key => savedKpi[key] !== kpi[key]);
      if (needsUpdate) {
        await savedKpi.update(kpi);
      }
    }
  }
  if (seededKpiCount > 0) console.log(`Seeded ${seededKpiCount} KPIs`);
}

async function ensureCompanyMetricWeightColumn() {
  const [columns] = await sequelize.query('PRAGMA table_info(CompanyMetrics);');
  const hasWeight = columns.some(column => column.name === 'weight');
  if (!hasWeight) {
    await sequelize.query('ALTER TABLE CompanyMetrics ADD COLUMN weight FLOAT NOT NULL DEFAULT 0;');
    console.log('Added CompanyMetrics.weight column');
  }
}

// Database synchronization and Server Start
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('Database connected and synced');
    await ensureCompanyMetricWeightColumn();
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
// Deployment: Sun Apr 19 21:44:38 SLST 2026
// Redeploy trigger Mon Apr 20 06:11:21 SLST 2026
// Mon Apr 20 07:08:18 SLST 2026
