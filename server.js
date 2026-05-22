require('dotenv').config();
const express = require('express');
const cors = require('cors');
const DatabaseConfig = require('./config/database');
const { seedDatabase } = require('./utils/seed');
const auth = require('./middleware/auth');

const authRoutes = require('./routes/authRoutes');
const unitRoutes = require('./routes/unitRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const userRoutes = require('./routes/userRoutes');
const roleRoutes = require('./routes/roleRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

const app = express();
const PORT = parseInt(process.env.PORT) || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'headsupeye-backend' });
});

// Public
app.use('/api/auth', authRoutes);

// Protected — every route below requires a valid Bearer token
app.use('/api/units', auth, unitRoutes);
app.use('/api/employees', auth, employeeRoutes);
app.use('/api/users', auth, userRoutes);
app.use('/api/roles', auth, roleRoutes);
app.use('/api/dashboard', auth, dashboardRoutes);
app.use('/api/attendance', auth, attendanceRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

const database = new DatabaseConfig();

async function startServer() {
  try {
    await database.connect();
    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`HeadsUp Eye backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
