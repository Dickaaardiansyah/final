// routes/index.js - Updated tanpa Catalog Management Routes
import express from 'express';
import path from 'path';
import {
  getUsers,
  Register,
  Login,
  Logout,
  verifyOTP,
  resendOTP,
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

import {
  getAllGalery,
  getGaleryById,
  createGalery,
  updateGalery,
  deleteGalery
} from '../controllers/Galery.js';

import {
  getAllRecipes,
  getRecipeById,
  getRecipesByFishName,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getUniqueFishNames
} from '../controllers/Recipe.js';

import multer from 'multer';
import Users from '../models/userModel.js';
import { Op } from 'sequelize';
import bcrypt from 'bcrypt';
import { saveToDataIkan } from '../controllers/Models.js';
import { getAllDataIkan } from '../controllers/Models.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
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
router.post('/api/save-to-catalog', verifyToken, upload.single('image'), saveToCatalog); // Catatan: Jika saveToCatalog tidak diperlukan, hapus ini juga
router.get('/api/get-scans', getScans);
router.get('/api/get-catalog', getCatalog); // Catatan: Jika getCatalog tidak diperlukan, hapus ini juga

// ==================== GALERY PUBLIC ROUTES ====================
router.get('/api/galery', getAllGalery);
router.get('/api/galery/:id', getGaleryById);
router.post('/api/galery', verifyAdminToken, createGalery);
router.put('/api/galery/:id', verifyAdminToken, updateGalery);
router.delete('/api/galery/:id', verifyAdminToken, deleteGalery);

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

// Public routes (anyone can view recipes)
router.get('/api/recipes', getAllRecipes);
router.get('/api/recipes/fish-names', getUniqueFishNames);
router.get('/api/recipes/:id', getRecipeById);
router.get('/api/recipes/fish/:fishName', getRecipesByFishName);

// Admin routes (need admin auth to create/update/delete)
router.post('/api/recipes', verifyAdminToken, createRecipe);
router.put('/api/recipes/:id', verifyAdminToken, updateRecipe);
router.delete('/api/recipes/:id', verifyAdminToken, deleteRecipe);

export default router;