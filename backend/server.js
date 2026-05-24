// ============================================================
// Helpdesk Backend — Main Server Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ticketRoutes = require('./routes/ticketRoutes');
const technicianRoutes = require('./routes/technicianRoutes');
const adminRoutes = require('./routes/adminRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { startCronJobs } = require('./scripts/cronJobs');
const { prisma } = require('./config/db');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Start cron jobs
startCronJobs();

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin:  true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging
app.use(requestLogger);

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

// ============================================================
// Initialize Database and Start Server
// ============================================================
const initDbAndStart = async () => {
  try {
    // Ensure custom sequences exist
    await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START WITH 1000;`);
    
    // Sync the sequence with the max existing ticket number to prevent Unique Constraint errors
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
          max_num INTEGER;
      BEGIN
          -- Find the highest existing ticket number (e.g., HD-0001050 -> 1050)
          SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INTEGER)), 999) INTO max_num 
          FROM tickets 
          WHERE ticket_number LIKE 'HD-%';
          
          -- Set the sequence to that maximum value so nextval() generates the one after
          PERFORM setval('ticket_number_seq', max_num);
      EXCEPTION WHEN OTHERS THEN
          -- Ignore if the tables don't exist yet or other parsing errors happen during initial migration
          NULL;
      END $$;
    `);

    // Ensure default system settings exist
    await prisma.$executeRawUnsafe(`
      INSERT INTO system_settings (setting_key, setting_value) 
      VALUES ('otp_enabled', 'true')
      ON CONFLICT (setting_key) DO NOTHING;
    `);
    
    console.log('✅ Database initialization completed');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`✅ Helpdesk API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

initDbAndStart();

module.exports = app;
