import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promisify } from 'util';
import FishPredictions from '../models/fishPredictionModel.js'; // Import model Sequelize
import Users from '../models/userModel.js'; // Import Users model
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize'; // Import Sequelize operators
import DataIkan from '../models/dataIkanModel.js';

// Untuk ES module (__dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify untuk async/await
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

// Helper function untuk handle Python process
const handlePythonProcess = (python, res) => {
  let output = '';
  let responded = false;

  python.stdout.on('data', (data) => {
    output += data.toString();
  });

  python.stderr.on('data', (data) => {
    const errMsg = data.toString();
    console.error('Python stderr:', errMsg);

    const isRealError =
      errMsg.includes('Traceback') ||
      errMsg.toLowerCase().includes('error') ||
      errMsg.toLowerCase().includes('exception');

    if (!responded && isRealError) {
      responded = true;
      res.status(500).json({
        error: 'Model prediction failed: ' + errMsg,
        status: 'error',
      });
    }
  });

  python.on('close', () => {
    if (responded) return;

    try {
      const result = JSON.parse(output);
      responded = true;
      res.json(result);
    } catch (err) {
      responded = true;
      res.status(500).json({
        error: 'Failed to parse output: ' + err.message,
        status: 'error',
      });
    }
  });

  // Timeout handler
  setTimeout(() => {
    if (!responded) {
      responded = true;
      python.kill();
      res.status(500).json({
        error: 'Python script timeout',
        status: 'error',
      });
    }
  }, 30000);
};

// Helper function untuk get user ID dari token
const getUserIdFromToken = (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return decoded.userId;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function untuk convert image to base64
const convertImageToBase64 = async (imagePath) => {
  try {
    const imageBuffer = await readFile(imagePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = path.extname(imagePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return null;
  }
};

// Helper function untuk copy file gambar ke folder permanent
const copyImageToDataFolder = async (tempPath, newFilename) => {
  try {
    const dataDir = path.join(__dirname, '..', 'data', 'images');
    
    // Pastikan folder images ada
    try {
      await mkdir(dataDir, { recursive: true });
    } catch (err) {
      // Folder sudah ada
    }

    const newPath = path.join(dataDir, newFilename);
    
    // Copy file
    await fs.promises.copyFile(tempPath, newPath);
    
    return `data/images/${newFilename}`;
  } catch (error) {
    console.error('Error copying image:', error);
    return tempPath; // Return original path as fallback
  }
};

// Tabular prediction
export const predictTabular = (req, res) => {
  const features = req.body.features;

  if (!features || !Array.isArray(features)) {
    return res.status(400).json({
      error: 'Features array is required',
      status: 'error',
    });
  }

  const scriptPath = path.join(__dirname, '..', 'models', 'predict.py');
  const python = spawn('python', [scriptPath, JSON.stringify(features)]);

  handlePythonProcess(python, res);
};

// Image prediction
export const predictImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Image file is required',
      status: 'error',
    });
  }

  const imagePath = req.file.path;
  const scriptPath = path.join(__dirname, '..', 'models', 'predict.py');
  const python = spawn('python', [scriptPath, 'image', imagePath]);

  handlePythonProcess(python, res);
};

// ==================== DATABASE SAVE FUNCTIONS ====================

//getdatatohistory
export const getAllDataIkan = async (req, res) => {
  try {
    const data = await DataIkan.findAll({
      include: [{ model: Users, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = data.map(item => ({
      id: item.id,
      date: item.createdAt,
      status: "completed",
      fishData: {
        name: item.namaIkan,
        predicted_class: item.predictedClass,
        confidence: `${(item.probability * 100).toFixed(1)}%`,
        habitat: item.habitat,
        konsumsi: item.konsumsi,
        icon: "🐟",
        top_predictions: item.notes ? JSON.parse(item.notes.replace("Top 3 predictions: ", "") || "[]") : []
      },
      image: item.fishImage
    }));

    res.json({ status: "success", data: formatted });
  } catch (err) {
    console.error("Error fetching data_ikan:", err);
    res.status(500).json({ status: "error", message: err.message });
  }
};

export const saveToDataIkan = async (req, res) => {
  try {
    let userId = getUserIdFromToken(req) || req.body.userId || 1;

    const { fish_name, predicted_class, confidence, habitat, konsumsi, top_predictions, notes } = req.body;
    if (!fish_name || !predicted_class || !confidence) {
      return res.status(400).json({ status: 'error', message: 'fish_name, predicted_class, dan confidence harus diisi' });
    }

    let fishImageBase64 = null;
    if (req.file) {
      fishImageBase64 = await convertImageToBase64(req.file.path);
    }

    const newData = await DataIkan.create({
      userId,
      namaIkan: fish_name,
      predictedClass: predicted_class,
      probability: parseFloat(confidence) / 100,
      habitat: habitat || 'Tidak diketahui',
      konsumsi: konsumsi || 'Tidak diketahui',
      fishImage: fishImageBase64,
      notes: notes || `Top 3 predictions: ${top_predictions || '[]'}`
    });

    res.json({ status: 'success', message: 'Data berhasil disimpan ke data_ikan', data: newData });
  } catch (err) {
    console.error('Error saving to data_ikan:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// Save scan result to database table
export const saveScan = async (req, res) => {
  try {
    console.log('=== Save Scan to Database ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    // Get user ID dari token (atau fallback)
    let userId = getUserIdFromToken(req);
    
    // Jika tidak ada token, coba ambil dari body atau gunakan default
    if (!userId) {
      userId = req.body.userId || req.user?.id || 1; // Fallback ke user ID 1
      console.log('Using fallback userId:', userId);
    }

    // Validasi input
    const {
      fish_name,
      predicted_class,
      confidence,
      habitat,
      konsumsi,
      top_predictions,
      notes
    } = req.body;

    if (!fish_name || !predicted_class || !confidence) {
      return res.status(400).json({
        status: 'error',
        message: 'fish_name, predicted_class, dan confidence harus diisi',
      });
    }

    // Handle image - convert to base64
    let fishImageBase64 = null;
    if (req.file) {
      fishImageBase64 = await convertImageToBase64(req.file.path);
      
      // Optional: Copy to permanent folder juga
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = path.extname(req.file.originalname);
      const newFilename = `scan_${timestamp}${extension}`;
      await copyImageToDataFolder(req.file.path, newFilename);
    }

    // Prepare data untuk database
    const predictionData = {
      userId: userId,
      predictedFishName: fish_name || predicted_class,
      probability: parseFloat(confidence) / 100, // Convert dari percentage ke decimal
      habitat: habitat || 'Tidak diketahui',
      consumptionSafety: konsumsi || 'Tidak diketahui',
      fishImage: fishImageBase64,
      notes: notes || `Top 3 predictions: ${top_predictions || '[]'}`
    };

    console.log('Saving to database:', {
      ...predictionData,
      fishImage: fishImageBase64 ? '[BASE64_DATA]' : null // Hide base64 in logs
    });

    // Simpan ke database menggunakan Sequelize
    const savedPrediction = await FishPredictions.create(predictionData);

    console.log('Data saved to database successfully:', savedPrediction.id);

    // Response sukses
    res.json({
      status: 'success',
      message: 'Data berhasil disimpan ke database',
      success: true,
      data: {
        id: savedPrediction.id,
        fish_name: savedPrediction.predictedFishName,
        predicted_class: savedPrediction.predictedFishName,
        confidence: (savedPrediction.probability * 100).toFixed(2) + '%',
        habitat: savedPrediction.habitat,
        consumption_safety: savedPrediction.consumptionSafety,
        prediction_date: savedPrediction.predictionDate,
        prediction_time: savedPrediction.predictionTime,
        created_at: savedPrediction.createdAt
      }
    });

  } catch (error) {
    console.error('Error saving scan to database:', error);
    res.status(500).json({
      status: 'error',
      message: `Gagal menyimpan data: ${error.message}`,
      success: false
    });
  }
};

// Save to catalog (sama seperti saveScan tapi bisa ditambah field khusus catalog)
export const saveToCatalog = async (req, res) => {
  try {
    console.log('=== SAVE TO CATALOG DEBUG ===');
    console.log('User from middleware:', {
      userId: req.userId,
      email: req.email, 
      name: req.name
    });

    // CRITICAL: Gunakan userId dari verifyToken middleware
    const userId = req.userId; // Dari middleware, bukan dari helper function
    
    if (!userId) {
      console.error('❌ No user ID from middleware!');
      return res.status(401).json({
        status: 'error',
        message: 'User tidak teridentifikasi. Silakan login ulang.'
      });
    }

    // Verify user exists and has permission
    const user = await Users.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User tidak ditemukan'
      });
    }

    // Check catalog access permission
    if (user.role !== 'contributor' && user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak. Anda perlu menjadi kontributor untuk menambah ke katalog.'
      });
    }

    const {
      fish_name,
      predicted_class,
      confidence,
      habitat,
      konsumsi,
      top_predictions,
      notes
    } = req.body;

    if (!fish_name || !predicted_class || !confidence) {
      return res.status(400).json({
        status: 'error',
        message: 'fish_name, predicted_class, dan confidence harus diisi',
      });
    }

    // Handle image conversion
    let fishImageBase64 = null;
    if (req.file) {
      fishImageBase64 = await convertImageToBase64(req.file.path);
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const extension = path.extname(req.file.originalname);
      const newFilename = `catalog_${userId}_${timestamp}${extension}`; // Include userId in filename
      await copyImageToDataFolder(req.file.path, newFilename);
    }

    // Prepare catalog data dengan userId yang benar
    const catalogData = {
      userId: userId, // CRITICAL: Gunakan userId dari middleware
      predictedFishName: fish_name || predicted_class,
      namaIkan: fish_name, // Untuk catalog entries
      kategori: konsumsi === 'Dapat dikonsumsi' ? 'Ikan Konsumsi' : 'Ikan Hias',
      probability: parseFloat(confidence) / 100,
      habitat: habitat || 'Tidak diketahui',
      consumptionSafety: konsumsi || 'Tidak diketahui',
      fishImage: fishImageBase64,
      notes: notes || `CATALOG ITEM - Top 3 predictions: ${top_predictions || '[]'}`,
      deskripsiTambahan: notes ? notes.split('|')[0].replace('CATALOG ITEM - ', '') : '',
      lokasiPenangkapan: notes ? (notes.split('|')[1]?.replace('Lokasi: ', '') || '') : '',
      tanggalDitemukan: notes ? (notes.split('|')[2]?.replace('Tanggal: ', '') || '') : '',
      kondisiIkan: notes ? (notes.split('|')[3]?.replace('Kondisi: ', '') || 'mati') : 'mati'
    };

    console.log('📝 Saving catalog data:', {
      userId: catalogData.userId,
      fish_name: catalogData.predictedFishName,
      namaIkan: catalogData.namaIkan
    });

    // Simpan ke database dengan userId yang benar
    const savedCatalog = await FishPredictions.create(catalogData);

    console.log('✅ Catalog saved successfully:', {
      id: savedCatalog.id,
      userId: savedCatalog.userId,
      fishName: savedCatalog.namaIkan
    });

    res.json({
      status: 'success',
      message: `Data berhasil ditambahkan ke katalog oleh ${user.name}`,
      success: true,
      data: {
        id: savedCatalog.id,
        userId: savedCatalog.userId, // Return untuk verifikasi
        fish_name: savedCatalog.namaIkan,
        predicted_class: savedCatalog.predictedFishName,
        confidence: (savedCatalog.probability * 100).toFixed(2) + '%',
        habitat: savedCatalog.habitat,
        consumption_safety: savedCatalog.consumptionSafety,
        created_at: savedCatalog.createdAt,
        contributor: user.name
      }
    });

  } catch (error) {
    console.error('❌ Error saving to catalog:', error);
    res.status(500).json({
      status: 'error',
      message: `Gagal menambahkan ke katalog: ${error.message}`,
      success: false
    });
  }
};

// ==================== GET DATA FROM DATABASE ====================

// Get all scans from database
export const getScans = async (req, res) => {
  try {
    // Get user ID dari token jika ada
    let userId = getUserIdFromToken(req);
    
    let whereClause = {};
    if (userId) {
      whereClause.userId = userId; // Filter by user if authenticated
    }

    const scans = await FishPredictions.findAll({
      where: whereClause,
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'name', 'email'] // Don't expose password
      }],
      order: [['createdAt', 'DESC']],
      limit: 20 // Limit untuk performance
    });

    const formattedScans = scans.map(scan => ({
      id: scan.id,
      fish_name: scan.predictedFishName,
      predicted_class: scan.predictedFishName,
      confidence: (scan.probability * 100).toFixed(2) + '%',
      habitat: scan.habitat,
      consumption_safety: scan.consumptionSafety,
      fish_image: scan.fishImage,
      prediction_date: scan.predictionDate,
      prediction_time: scan.predictionTime,
      notes: scan.notes,
      created_at: scan.createdAt,
      updated_at: scan.updatedAt,
      user: scan.user
    }));

    res.json({
      status: 'success',
      data: formattedScans,
      count: formattedScans.length
    });

  } catch (error) {
    console.error('Error getting scans:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get catalog items (items with CATALOG in notes)
export const getCatalog = async (req, res) => {
  try {
    // Get user ID dari token jika ada
    let userId = getUserIdFromToken(req);
    
    let whereClause = {
      notes: {
        [Op.like]: '%CATALOG%' // Filter items yang ditandai sebagai catalog
      }
    };
    
    if (userId) {
      whereClause.userId = userId; // Filter by user if authenticated
    }

    const catalogItems = await FishPredictions.findAll({
      where: whereClause,
      include: [{
        model: Users,
        as: 'user',
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']],
      limit: 20
    });

    const formattedCatalog = catalogItems.map(item => ({
      id: item.id,
      fish_name: item.predictedFishName,
      predicted_class: item.predictedFishName,
      confidence: (item.probability * 100).toFixed(2) + '%',
      habitat: item.habitat,
      consumption_safety: item.consumptionSafety,
      fish_image: item.fishImage,
      prediction_date: item.predictionDate,
      prediction_time: item.predictionTime,
      notes: item.notes,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
      user: item.user
    }));

    res.json({
      status: 'success',
      data: formattedCatalog,
      count: formattedCatalog.length
    });

  } catch (error) {
    console.error('Error getting catalog:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};