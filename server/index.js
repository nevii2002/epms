const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('./config/database');
const { User, Evaluation, EvaluationDetail } = require('./models');

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

async function seedAdminIfEmpty() {
  const bcrypt = require('bcryptjs');
  const count = await User.count();
  if (count === 0) {
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
}

// Database synchronization and Server Start
sequelize.sync({ alter: false })
  .then(async () => {
    console.log('Database connected and synced');
    await seedAdminIfEmpty();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
