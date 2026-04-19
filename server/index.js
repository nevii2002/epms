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
  { title: 'Quality of Work Product', description: 'Subjective rating of accuracy and thoroughness.', category: 'Qualitative', unit: 'Rating', weight: 10 },
  { title: 'Dispute Rate', description: 'Tasks resulting in formal complaints.', category: 'Quantitative', unit: 'Percentage', weight: 5, targetValue: 1 },
  { title: 'Disputes Converted to Satisfied', description: 'Problem-solving skills in conflicts.', category: 'Quantitative', unit: 'Count', weight: 5, targetValue: 5 },
  { title: 'Tips or Recognition', description: 'External positive feedback or rewards.', category: 'Quantitative', unit: 'Currency/Count', weight: 5, targetValue: 100 },
  { title: 'Adaptability & Learning', description: 'Speed of mastering new technologies.', category: 'Qualitative', unit: 'Rating', weight: 10 }
];

async function seedDatabase() {
  const bcrypt = require('bcryptjs');

  // Seed admin user if no users exist
  const userCount = await User.count();
  if (userCount === 0) {
    const hash = await bcrypt.hash('Admin@123', 10);
    await User.create({
      username: 'Admin',
      email: 'admin@techznap.com',
      password: hash,
      role: 'Admin',
      status: 'Active',
      jobCategory: 'Full time'
    });
    console.log('Seeded default admin: admin@techznap.com / Admin@123');
  }

  // Seed KPIs (idempotent - uses findOrCreate)
  const kpiCount = await KPI.count();
  if (kpiCount === 0) {
    for (const kpi of KPI_SEED) {
      await KPI.findOrCreate({ where: { title: kpi.title }, defaults: kpi });
    }
    console.log(`Seeded ${KPI_SEED.length} KPIs`);
  }
}

// Database synchronization and Server Start
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('Database connected and synced');
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
