// routes/index.js - Updated dengan Cookie Management Routes
import express from 'express';
import path from 'path';
import {
  getUsers,
  Register,
  Login,
  Logout,
  verifyOTP,
  resendOTP,
  getApprovedUsers
} from '../controllers/Users.js';
import {
  predictTabular,
  predictImage,
  saveScan,
  saveToCatalog,
  getScans,
  getCatalog
} from '../controllers/Models.js';
import { verifyToken } from '../middleware/VerifyToken.js';
import { refreshToken } from '../controllers/RefreshToken.js';
import {
  getAdmin,
  createAdmin,
  loginAdmin,
  logoutAdmin,
  getAllAdmins,
  updateAdminStatus,
  updateAdminPassword
} from '../controllers/Admin.js';
import { verifyAdminToken, requireSuperAdmin } from '../middleware/VerifyAdminToken.js';
import { refreshAdminToken } from '../controllers/AdminRefreshToken.js';

// ⭐ NEW: Import updated catalog controllers
import {
  requestCatalogAccess,
  getCatalogAccessStatus,
  savePredictionToCatalog,
  getAllCatalogEntries,
  getPendingCatalogRequests,
  approveCatalogRequest,
  rejectCatalogRequest,
  getCatalogStatistics,
  uploadKTP
} from '../controllers/CatalogController.js';

// ⭐ NEW: Import email controllers
import {
  sendCatalogReviewEmail,
  sendCatalogApprovedEmailController,
  sendCatalogRejectedEmailController,
  testEmailConnection,
  testEmailSending
} from '../controllers/EmailController.js';

import {
  getAllGalery,
  getGaleryById,
  createGalery,
  updateGalery,
  deleteGalery
} from '../controllers/Galery.js';

import multer from 'multer';
import Users from '../models/userModel.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt'; // Tambahkan bcrypt untuk hash password
import { saveToDataIkan } from '../controllers/Models.js';
import { getAllDataIkan } from '../controllers/Models.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder penyimpanan tetap
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9); // Hash unik
    const ext = path.extname(file.originalname); // Ambil ekstensi asli (misalnya .jpg)
    cb(null, uniqueSuffix + ext); // Simpan sebagai hash + ekstensi
  }
});

const upload = multer({
  storage: storage, // Gunakan storage custom
  limits: { fileSize: 5 * 1024 * 1024 }, // Maksimal 5MB
  fileFilter: (req, file, cb) => {
    // Validasi format file (opsional, untuk mencegah error lebih awal)
    const filetypes = /jpeg|jpg|png|webp|bmp|heic|tif|tiff|mpo|pfm|dng/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung! Hanya gambar (jpg, png, dll.) yang diizinkan.'));
    }
  }
});

// ==================== AUTH ROUTES ====================
router.get('/users', verifyToken, getUsers);
router.post('/users', Register);
router.post('/login', Login);
router.post('/token', refreshToken);
router.delete('/logout', Logout);

// OTP Routes
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);

// Endpoint untuk memperbarui data profil
// Endpoint untuk memperbarui data profil - FIXED VERSION
router.put('/users/update', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Log untuk debugging
    console.log('🔍 Update request from user:', userId);
    console.log('📝 Request body:', req.body);

    // Destructure dengan field names yang sesuai dengan model database
    const { name, email, password, phone, gender, birthday } = req.body;

    const updateData = {};

    // Validasi dan build update object
    if (name !== undefined) {
      if (name.length < 2) {
        return res.status(400).json({ msg: 'Nama pengguna minimal 2 karakter' });
      }
      updateData.name = name;
    }

    if (email !== undefined) {
      if (!email.includes('@')) {
        return res.status(400).json({ msg: 'Format email tidak valid' });
      }
      const existingEmail = await Users.findOne({
        where: { email, id: { [Op.ne]: userId } }
      });
      if (existingEmail) {
        return res.status(400).json({ msg: 'Email sudah digunakan' });
      }
      updateData.email = email;
    }

    if (password !== undefined && password !== '***********') {
      if (password.length < 6) {
        return res.status(400).json({ msg: 'Password minimal 6 karakter' });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    if (phone !== undefined) {
      if (phone.length < 8 || !/^\d+$/.test(phone)) {
        return res.status(400).json({ msg: 'Nomor HP tidak valid, minimal 8 digit dan hanya angka' });
      }
      const existingPhone = await Users.findOne({
        where: { phone, id: { [Op.ne]: userId } }
      });
      if (existingPhone) {
        return res.status(400).json({ msg: 'Nomor HP sudah digunakan' });
      }
      updateData.phone = phone;
    }

    if (gender !== undefined) {
      if (!['male', 'female'].includes(gender)) {
        return res.status(400).json({ msg: 'Jenis kelamin harus male atau female' });
      }
      updateData.gender = gender;
    }

    if (birthday !== undefined) {
      const date = new Date(birthday);
      if (isNaN(date) || date > new Date()) {
        return res.status(400).json({ msg: 'Tanggal lahir tidak valid' });
      }
      updateData.birthday = birthday;
    }

    console.log('🔧 Update data to be saved:', updateData);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        msg: 'Tidak ada data yang diperbarui',
        debug: 'Received fields: ' + Object.keys(req.body).join(', ')
      });
    }

    // Update user
    const [affectedRows] = await Users.update(updateData, { where: { id: userId } });

    if (affectedRows === 0) {
      return res.status(404).json({ msg: 'User tidak ditemukan' });
    }

    console.log('✅ Profile updated successfully for user:', userId);

    res.status(200).json({
      msg: 'Data profil berhasil diperbarui',
      updatedFields: Object.keys(updateData)
    });

  } catch (error) {
    console.error('❌ Kesalahan saat memperbarui profil:', error);
    res.status(500).json({
      msg: 'Kesalahan server',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== ML PREDICTION ROUTES ====================
router.post('/predict', predictTabular);
router.post('/predict-image', upload.single('image'), predictImage);

// ==================== EXISTING SAVE ROUTES ====================
router.post('/api/save-scan', upload.single('image'), saveScan);
router.post('/api/save-to-catalog', verifyToken, upload.single('image'), saveToCatalog);
router.get('/api/get-scans', getScans);
router.get('/api/get-catalog', getCatalog);

// ==================== ⭐ CATALOG PERMISSION SYSTEM ROUTES ====================
// USER Catalog Routes (need login)
router.post('/api/catalog/request-access', verifyToken, requestCatalogAccess);
router.get('/api/catalog/my-status', verifyToken, getCatalogAccessStatus);

// Route untuk check approval status
router.get('/api/catalog/approval-status', verifyToken, async (req, res) => {
  try {
    console.log('🔍 Checking approval status for user:', req.userId);

    // Call the existing getCatalogAccessStatus function
    const result = await getCatalogAccessStatus(req, res);

    // If the function hasn't sent a response yet, we'll handle it here
    if (!res.headersSent) {
      return result;
    }
  } catch (error) {
    console.error('❌ Error checking approval status:', error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        status: 'pending',
        msg: 'Error checking approval status',
        error: error.message
      });
    }
  }
});

// ==================== ⭐ NEW: HTTP COOKIES MANAGEMENT ROUTES ====================
// Get catalog status from HTTP cookies
router.get('/api/catalog/status', verifyToken, async (req, res) => {
  try {
    console.log('📖 Getting catalog status from cookies for user:', req.user?.email || req.userId);

    // Get status from cookies
    const catalogRequestSubmitted = req.cookies.catalogRequestSubmitted === 'true';
    const adminApprovalStatus = req.cookies.adminApprovalStatus || 'pending';

    console.log('🍪 Cookie values:', {
      catalogRequestSubmitted,
      adminApprovalStatus
    });

    res.json({
      status: 'success',
      data: {
        catalogRequestSubmitted,
        adminApprovalStatus
      }
    });

  } catch (error) {
    console.error('❌ Error getting catalog status from cookies:', error);
    res.status(500).json({
      status: 'error',
      msg: 'Failed to get catalog status'
    });
  }
});

// Set catalog status to HTTP cookies
router.post('/api/catalog/status', verifyToken, async (req, res) => {
  try {
    const { catalogRequestSubmitted, adminApprovalStatus } = req.body;

    console.log('💾 Setting catalog status to cookies for user:', req.user?.email || req.userId);
    console.log('🍪 Setting values:', {
      catalogRequestSubmitted,
      adminApprovalStatus
    });

    const cookieOptions = {
      httpOnly: true,        // Cannot be accessed by JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax',      // CSRF protection
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };

    // Set HTTP-only cookies
    if (catalogRequestSubmitted !== undefined) {
      res.cookie('catalogRequestSubmitted', catalogRequestSubmitted.toString(), cookieOptions);
    }

    if (adminApprovalStatus !== undefined) {
      res.cookie('adminApprovalStatus', adminApprovalStatus, cookieOptions);
    }

    res.json({
      status: 'success',
      msg: 'Catalog status saved to cookies successfully',
      data: {
        catalogRequestSubmitted,
        adminApprovalStatus
      }
    });

  } catch (error) {
    console.error('❌ Error setting catalog status to cookies:', error);
    res.status(500).json({
      status: 'error',
      msg: 'Failed to save catalog status'
    });
  }
});

// Clear catalog status from HTTP cookies
router.delete('/api/catalog/status', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Clearing catalog status cookies for user:', req.user?.email || req.userId);

    // Clear cookies by setting them to expire immediately
    const clearCookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0) // Expire immediately
    };

    res.clearCookie('catalogRequestSubmitted', clearCookieOptions);
    res.clearCookie('adminApprovalStatus', clearCookieOptions);

    res.json({
      status: 'success',
      msg: 'Catalog status cookies cleared successfully'
    });

  } catch (error) {
    console.error('❌ Error clearing catalog status cookies:', error);
    res.status(500).json({
      status: 'error',
      msg: 'Failed to clear catalog status'
    });
  }
});

// Debug endpoint to check all cookies
router.get('/api/debug/cookies', verifyToken, async (req, res) => {
  try {
    console.log('🐛 Debug: Checking all cookies for user:', req.user?.email || req.userId);

    const allCookies = req.cookies;
    const catalogCookies = {
      catalogRequestSubmitted: req.cookies.catalogRequestSubmitted,
      adminApprovalStatus: req.cookies.adminApprovalStatus
    };

    console.log('🍪 All cookies:', allCookies);
    console.log('🗂️ Catalog-specific cookies:', catalogCookies);

    res.json({
      status: 'success',
      data: {
        all_cookies: allCookies,
        catalog_cookies: catalogCookies,
        user: {
          id: req.userId,
          name: req.user?.name,
          email: req.user?.email
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in debug cookies:', error);
    res.status(500).json({
      status: 'error',
      msg: 'Debug error'
    });
  }
});

// ==================== EXISTING CATALOG ROUTES ====================
router.post('/api/catalog/save-prediction', verifyToken, savePredictionToCatalog);

// ⭐ FIXED: Get catalog entries - menggunakan existing controller function
router.get('/api/catalog/entries', getAllCatalogEntries);

// ⭐ SIMPLE SOLUTION: Route wrapper untuk filter data pribadi
router.post('/api/catalog/upload-ktp', verifyToken, upload.single('ktp'), uploadKTP);

// ADMIN Catalog Routes (need admin login)
router.get('/api/catalog/admin/pending-requests', verifyAdminToken, getPendingCatalogRequests);
router.post('/api/catalog/admin/approve/:userId', verifyAdminToken, approveCatalogRequest);
router.post('/api/catalog/admin/reject/:userId', verifyAdminToken, rejectCatalogRequest);
router.get('/api/catalog/admin/statistics', verifyAdminToken, getCatalogStatistics);

// ==================== ⭐ EMAIL NOTIFICATION ROUTES ====================
// Test email connection
router.get('/api/email/test-connection', testEmailConnection);

// User email routes (with authentication)
router.post('/api/email/catalog-review', verifyToken, sendCatalogReviewEmail);

// Admin email routes (with admin authentication)
router.post('/api/email/catalog-approved', verifyAdminToken, sendCatalogApprovedEmailController);
router.post('/api/email/catalog-rejected', verifyAdminToken, sendCatalogRejectedEmailController);

// Admin approval/rejection with automatic email sending
router.post('/api/email/admin/approve-user', verifyAdminToken, async (req, res) => {
  try {
    const { userId, email, name } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({
        success: false,
        msg: 'User ID, email, dan nama harus diisi'
      });
    }

    console.log('👨‍💼 Admin approving catalog access for user:', userId);

    // Create new request object for approveCatalogRequest
    const approvalReq = {
      ...req,
      params: { userId }
    };

    // Create new response object that doesn't send immediately
    let approvalResult;
    const approvalRes = {
      ...res,
      json: (data) => { approvalResult = data; return data; },
      status: (code) => ({ json: (data) => { approvalResult = { ...data, statusCode: code }; return data; } })
    };

    // Call approval function
    await approveCatalogRequest(approvalReq, approvalRes);

    if (approvalResult && !approvalResult.msg?.includes('gagal')) {
      // Create email request
      const emailReq = {
        ...req,
        body: { email, name }
      };

      let emailResult;
      const emailRes = {
        ...res,
        json: (data) => { emailResult = data; return data; },
        status: (code) => ({ json: (data) => { emailResult = { ...data, statusCode: code }; return data; } })
      };

      // Send approval email
      await sendCatalogApprovedEmailController(emailReq, emailRes);

      return res.json({
        success: true,
        msg: `Catalog access berhasil disetujui dan email telah dikirim ke ${name}`,
        approval: approvalResult,
        email: emailResult
      });
    } else {
      return res.status(400).json({
        success: false,
        msg: 'Gagal menyetujui catalog access',
        error: approvalResult
      });
    }

  } catch (error) {
    console.error('❌ Error in admin approval with email:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        msg: 'Server error saat approval user',
        error: error.message
      });
    }
  }
});

router.post('/api/email/admin/reject-user', verifyAdminToken, async (req, res) => {
  try {
    const { userId, email, name, reason } = req.body;

    if (!userId || !email || !name) {
      return res.status(400).json({
        success: false,
        msg: 'User ID, email, dan nama harus diisi'
      });
    }

    console.log('👨‍💼 Admin rejecting catalog access for user:', userId);

    // Create new request object for rejectCatalogRequest
    const rejectionReq = {
      ...req,
      params: { userId },
      body: { ...req.body, reason }
    };

    // Create new response object that doesn't send immediately
    let rejectionResult;
    const rejectionRes = {
      ...res,
      json: (data) => { rejectionResult = data; return data; },
      status: (code) => ({ json: (data) => { rejectionResult = { ...data, statusCode: code }; return data; } })
    };

    // Call rejection function
    await rejectCatalogRequest(rejectionReq, rejectionRes);

    if (rejectionResult && !rejectionResult.msg?.includes('gagal')) {
      // Create email request
      const emailReq = {
        ...req,
        body: { email, name, reason }
      };

      let emailResult;
      const emailRes = {
        ...res,
        json: (data) => { emailResult = data; return data; },
        status: (code) => ({ json: (data) => { emailResult = { ...data, statusCode: code }; return data; } })
      };

      // Send rejection email
      await sendCatalogRejectedEmailController(emailReq, emailRes);

      return res.json({
        success: true,
        msg: `Catalog access berhasil ditolak dan email telah dikirim ke ${name}`,
        rejection: rejectionResult,
        email: emailResult
      });
    } else {
      return res.status(400).json({
        success: false,
        msg: 'Gagal menolak catalog access',
        error: rejectionResult
      });
    }

  } catch (error) {
    console.error('❌ Error in admin rejection with email:', error);

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        msg: 'Server error saat reject user',
        error: error.message
      });
    }
  }
});

// Test email sending (for development)
router.post('/api/email/test', testEmailSending);

// ==================== GALERY PUBLIC ROUTES (NO AUTH) ====================
// Tambahkan setelah email routes dan sebelum admin auth routes

// ==================== ADMIN AUTH ROUTES ====================
router.post('/admin/create', createAdmin);
router.post('/admin/login', loginAdmin);
router.get('/admin/token', refreshAdminToken);
router.delete('/admin/logout', logoutAdmin);

// Protected admin routes
router.get('/admin/profile', verifyAdminToken, getAdmin);
router.get('/admin/all', verifyAdminToken, requireSuperAdmin, getAllAdmins);
router.put('/admin/:adminId/status', verifyAdminToken, requireSuperAdmin, updateAdminStatus);
router.put('/admin/:adminId/password', verifyAdminToken, updateAdminPassword);

//dataikan
router.post('/api/save-to-dataikan', upload.single('image'), saveToDataIkan);
router.get('/api/data-ikan', getAllDataIkan);

// Admin routes (perlu auth admin) - untuk mengelola galeri
router.get('/api/galery', getAllGalery);
router.get('/api/galery/:id', getGaleryById);
router.post('/api/galery', verifyAdminToken, createGalery);
router.put('/api/galery/:id', verifyAdminToken, updateGalery);
router.delete('/api/galery/:id', verifyAdminToken, deleteGalery);
router.get('/api/admin/approved-users', verifyAdminToken, getApprovedUsers);

export default router;