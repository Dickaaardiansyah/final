import express from 'express';
import dotenv from 'dotenv';
import db from './config/Database.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
// import Users from './models/userModel.js';
// import FishPredictions from './models/fishPredictionModel.js';
// import Admin from './models/adminModel.js';
// import DataIkan from './models/dataIkanModel.js';
// import Galery from './models/galeryModels.js';

import router from './routes/index.js';

dotenv.config();
const app = express();

console.log('ACCESS_TOKEN_SECRET:', process.env.ACCESS_TOKEN_SECRET);
console.log('REFRESH_TOKEN_SECRET:', process.env.REFRESH_TOKEN_SECRET);
console.log('All env vars:', Object.keys(process.env).filter(key => key.includes('TOKEN')));

// ⭐ NEW: Check email configuration on startup
console.log('\n📧 EMAIL SERVICE CONFIGURATION:');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('\n⚠️  WARNING: Email service not configured!');
  console.log('📝 To enable email notifications:');
  console.log('1. Add EMAIL_USER=your_email@gmail.com to .env');
  console.log('2. Add EMAIL_PASS=your_16_char_app_password to .env');
  console.log('3. Enable 2-Factor Auth in Google Account');
  console.log('4. Generate App Password in Google Security settings\n');
} else {
  console.log('✅ Email service configured successfully\n');
}

try {
    await db.authenticate();
    console.log('Database connected...');
    // await Users.sync();
    // await FishPredictions.sync();
    // await Admin.sync(); 
    // await DataIkan.sync();
    // await Galery.sync();
} catch (error) {
  console.error('Database connection failed:', error);
}

// CORS configuration
app.use(cors({ 
  credentials: true, 
  origin: 'http://localhost:5173'
}));

app.use(cookieParser()); 

// UPDATE INI: Increase body parser limits untuk handle gambar base64
app.use(express.json({ 
  limit: '50mb',           // Increase dari default 1mb ke 50mb
  parameterLimit: 100000,  // Increase parameter limit
  extended: true 
}));

app.use(express.urlencoded({ 
  limit: '50mb',           // Increase limit untuk form data
  parameterLimit: 100000,
  extended: true 
}));

// Serve static files untuk uploaded images
app.use('/uploads', express.static('uploads'));

// Add request logging middleware (optional)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  
  // Log email-related requests
  if (req.path.includes('/email/')) {
    console.log(`📧 Email request: ${req.method} ${req.path}`);
    if (req.body && Object.keys(req.body).length > 0) {
      const logBody = { ...req.body };
      // Hide sensitive data in logs
      if (logBody.password) logBody.password = '***';
      if (logBody.token) logBody.token = '***';
      console.log('   Body:', JSON.stringify(logBody, null, 2));
    }
  }
  
  next();
});

app.use(router);

// ⭐ NEW: Add email service status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const status = {
      server: 'running',
      database: 'connected',
      email: {
        configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        service: 'gmail'
      },
      timestamp: new Date().toISOString()
    };

    // Test email connection if configured
    if (status.email.configured) {
      try {
        const { testEmailConnection } = await import('./services/emailService.js');
        const emailTest = await testEmailConnection();
        status.email.connection = emailTest.success ? 'connected' : 'failed';
        status.email.error = emailTest.error || null;
      } catch (error) {
        status.email.connection = 'error';
        status.email.error = error.message;
      }
    } else {
      status.email.connection = 'not_configured';
    }

    res.json(status);
  } catch (error) {
    res.status(500).json({
      server: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(5000, () => {
  console.log('🚀 Server is running on http://localhost:5000');
});
