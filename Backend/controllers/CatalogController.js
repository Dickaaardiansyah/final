import Users from '../models/userModel.js';
import Admin from '../models/adminModel.js';
import FishPredictions from '../models/fishPredictionModel.js';
import { Op } from 'sequelize';

// ⭐ IMPORT email functions
import {
    sendCatalogApprovedEmail,
    sendCatalogRejectedEmail,
    sendCatalogReviewEmail
} from '../services/emailService.js';

// ⭐ FIXED: Get catalog access status - proper email verification check
export const getCatalogAccessStatus = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        const isEmailVerified = user.is_verified === true;
        const canAccessCatalog = user.role === 'contributor' || user.role === 'admin';

        const statusData = {
            can_access_catalog: canAccessCatalog,
            role: user.role || 'user',
            request_status: user.catalog_request_status || 'none',
            request_date: user.catalog_request_date,
            approved_date: user.catalog_approved_date,
            rejection_reason: user.catalog_rejection_reason,
            is_email_verified: isEmailVerified,
            is_verified: isEmailVerified,
            user_info: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        };

        res.status(200).json({
            msg: "Status akses katalog berhasil diambil",
            data: statusData
        });

    } catch (error) {
        console.error('Error checking catalog access status:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

export const requestCatalogAccess = async (req, res) => {
    try {
        const userId = req.userId;
        const { reason } = req.body;

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        console.log('🚀 Processing catalog request for user:', {
            id: user.id,
            name: user.name,
            is_verified: user.is_verified,
            role: user.role
        });

        // Cek email verification
        const isEmailVerified = user.is_verified === true;

        if (!isEmailVerified) {
            return res.status(400).json({
                msg: "Verifikasi email terlebih dahulu sebelum request akses katalog"
            });
        }

        // Cek apakah sudah bisa akses katalog
        if (user.role === 'contributor' || user.role === 'admin') {
            return res.status(400).json({
                msg: "Anda sudah memiliki akses katalog"
            });
        }

        // Cek apakah sudah ada request pending
        if (user.catalog_request_status === 'pending') {
            return res.status(400).json({
                msg: "Request akses katalog Anda sedang dalam proses review"
            });
        }

        if (user.catalog_request_status === 'rejected') {
            return res.status(400).json({
                msg: "Request akses katalog Anda ditolak. Hubungi admin untuk info lebih lanjut",
                rejection_reason: user.catalog_rejection_reason
            });
        }

        // ⭐ CHANGED: Set status to PENDING (not auto-approve)
        await user.update({
            catalog_request_status: 'pending',
            catalog_request_date: new Date(),
            catalog_rejection_reason: null // Clear previous rejection
        });

        console.log('📝 Catalog request submitted for approval:', user.name);

        // ⭐ NEW: Send review notification email
        try {
            console.log('📧 Sending review notification email to:', user.email);
            const emailResult = await sendCatalogReviewEmail(user.email, user.name);

            if (emailResult.success) {
                console.log('✅ Review notification email sent successfully:', emailResult.messageId);
            } else {
                console.log('⚠️ Failed to send review notification email');
            }
        } catch (emailError) {
            console.error('⚠️ Error sending review notification email:', emailError.message);
            // Don't fail the whole process if email fails
        }

        res.status(200).json({
            msg: "Request akses katalog berhasil dikirim! Tim kami akan review dalam 1-3 hari kerja.",
            data: {
                request_status: 'pending',
                request_date: new Date(),
                reason: reason || null,
                message: "Request Anda sedang dalam antrian review admin.",
                email_notification: "Email notifikasi telah dikirim ke " + user.email
            }
        });

    } catch (error) {
        console.error('Error requesting catalog access:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ SAVE PREDICTION TO CATALOG (hanya untuk contributor/admin)
export const savePredictionToCatalog = async (req, res) => {
    try {
        const userId = req.userId;

        const user = await Users.findByPk(userId);
        if (!user || !(user.role === 'contributor' || user.role === 'admin')) {
            return res.status(403).json({
                msg: "Akses ditolak. Anda perlu menjadi kontributor untuk mengakses fitur ini."
            });
        }

        const {
            predictionId,
            namaIkan,
            kategori,
            deskripsiTambahan,
            tanggalDitemukan,
            lokasiPenangkapan,
            kondisiIkan,
            tingkatKeamanan,
            amanDikonsumsi,
            jauhDariPabrik
        } = req.body;

        const prediction = await FishPredictions.findOne({
            where: {
                id: predictionId,
                userId: userId
            }
        });

        if (!prediction) {
            return res.status(404).json({
                msg: "Hasil prediksi tidak ditemukan atau bukan milik Anda"
            });
        }

        await prediction.update({
            namaIkan: namaIkan || prediction.predictedFishName,
            kategori,
            deskripsiTambahan,
            tanggalDitemukan,
            lokasiPenangkapan,
            kondisiIkan,
            tingkatKeamanan,
            amanDikonsumsi,
            jauhDariPabrik
        });

        res.status(200).json({
            msg: "Hasil prediksi berhasil disimpan ke katalog",
            data: {
                id: prediction.id,
                nama_ikan: prediction.namaIkan,
                kategori: prediction.kategori,
                lokasi: prediction.lokasiPenangkapan,
                tanggal: prediction.tanggalDitemukan
            }
        });

    } catch (error) {
        console.error('Error saving prediction to catalog:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// SIMPLIFIED getAllCatalogEntries - Handle token internally
import jwt from 'jsonwebtoken';

// FIXED: getAllCatalogEntries dengan token extraction dari cookies
export const getAllCatalogEntries = async (req, res) => {
    try {
        console.log('🔍 getAllCatalogEntries called');

        const {
            kategori,
            lokasi,
            search,
            page = 1,
            limit = 50,
            my_data_only = false
        } = req.query;

        const offset = (page - 1) * limit;

        // FIXED: EXTRACT TOKEN FROM COOKIES (not Authorization header)
        let userId = null;
        let userName = null;

        try {
            // Try to get token from cookies first (priority)
            let token = req.cookies?.accessToken;

            // If no cookie token, try Authorization header as fallback
            if (!token) {
                const authHeader = req.headers['authorization'];
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }

            if (token) {
                console.log('🍪 Token source:', req.cookies?.accessToken ? 'cookie' : 'header');
                console.log('🔑 Extracted token:', token.substring(0, 20) + '...');

                const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
                userId = decoded.userId;
                userName = decoded.name;
                console.log('✅ Token verified for user:', userId);
            } else {
                console.log('ℹ️ No token provided');
            }
        } catch (tokenError) {
            console.log('⚠️ Token invalid or expired, continuing without auth:', tokenError.message);
        }

        // Build where condition
        let whereCondition = {
            namaIkan: { [Op.ne]: null }
        };

        // Filter by current user if requested and authenticated
        if (my_data_only === 'true') {
            if (userId) {
                whereCondition.userId = userId;
                console.log('🔒 Filtering data for user:', userId);
            } else {
                // If user wants personal data but not authenticated, return empty
                console.log('❌ Personal data requested but no valid token');
                return res.status(200).json({
                    msg: "Silakan login untuk melihat data pribadi",
                    data: [],
                    pagination: {
                        total_items: 0,
                        total_pages: 0,
                        current_page: parseInt(page),
                        items_per_page: parseInt(limit)
                    },
                    info: {
                        requires_login: true,
                        message: "Data pribadi memerlukan login"
                    }
                });
            }
        }

        // Apply other filters
        if (kategori) {
            whereCondition.kategori = kategori;
        }

        if (lokasi) {
            whereCondition.lokasiPenangkapan = { [Op.iLike]: `%${lokasi}%` };
        }

        if (search) {
            whereCondition[Op.or] = [
                { namaIkan: { [Op.iLike]: `%${search}%` } },
                { predictedFishName: { [Op.iLike]: `%${search}%` } },
                { deskripsiTambahan: { [Op.iLike]: `%${search}%` } }
            ];
        }

        console.log('🎯 Query conditions:', {
            whereCondition,
            my_data_only,
            authenticated_user: userId || 'none'
        });

        // DEBUG: Check data availability
        const totalInDb = await FishPredictions.count();
        const catalogCount = await FishPredictions.count({
            where: { namaIkan: { [Op.ne]: null } }
        });
        console.log(`📊 Database stats: ${totalInDb} total, ${catalogCount} in catalog`);

        if (my_data_only === 'true' && userId) {
            const userDataCount = await FishPredictions.count({
                where: { userId, namaIkan: { [Op.ne]: null } }
            });
            console.log(`👤 User ${userId} has ${userDataCount} catalog entries`);

            if (userDataCount === 0) {
                return res.status(200).json({
                    msg: "Anda belum memiliki data katalog",
                    data: [],
                    pagination: {
                        total_items: 0,
                        total_pages: 0,
                        current_page: parseInt(page),
                        items_per_page: parseInt(limit)
                    },
                    info: {
                        user_id: userId,
                        user_name: userName,
                        message: "Upload data melalui scan untuk menambah ke katalog"
                    }
                });
            }
        }

        // Execute main query
        const catalogEntries = await FishPredictions.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: Users,
                    as: 'user',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            attributes: [
                'id', 'namaIkan', 'predictedFishName', 'kategori',
                'deskripsiTambahan', 'tanggalDitemukan', 'lokasiPenangkapan',
                'kondisiIkan', 'tingkatKeamanan', 'amanDikonsumsi',
                'habitat', 'fishImage', 'createdAt', 'consumptionSafety',
                'userId'
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        console.log(`✅ Query successful: ${catalogEntries.count} total, ${catalogEntries.rows.length} returned`);

        res.status(200).json({
            msg: my_data_only === 'true'
                ? `Data katalog pribadi berhasil diambil (${catalogEntries.count} item)`
                : "Katalog ikan berhasil diambil",
            data: catalogEntries.rows,
            pagination: {
                total_items: catalogEntries.count,
                total_pages: Math.ceil(catalogEntries.count / limit),
                current_page: parseInt(page),
                items_per_page: parseInt(limit)
            },
            filter_info: {
                is_personal_data: my_data_only === 'true',
                authenticated_user: userId || null,
                user_name: userName || null,
                total_in_database: totalInDb,
                total_in_catalog: catalogCount
            }
        });

    } catch (error) {
        console.error('❌ Error in getAllCatalogEntries:', error);
        res.status(500).json({
            msg: "Server error",
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
};

// ⭐ ADMIN: Get pending catalog requests
// Di CatalogController.js, update query untuk include field KTP
export const getPendingCatalogRequests = async (req, res) => {
    try {
        const adminId = req.adminId;

        // Cek admin permission
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(403).json({
                msg: "Akses ditolak. Admin tidak ditemukan"
            });
        }

        // GET pending requests WITH KTP data
        const pendingRequests = await Users.findAll({
            where: {
                catalog_request_status: 'pending'
            },
            attributes: [
                'id', 'name', 'email', 'phone', 'gender',
                'catalog_request_date', 'catalog_request_status',
                'createdAt',
                'ktp_image_url', 'ktp_image_path' // ⭐ TAMBAHKAN INI
            ],
            order: [['catalog_request_date', 'ASC']]
        });

        // Format data untuk admin dashboard WITH KTP
        const formattedRequests = pendingRequests.map(user => ({
            id: user.id,
            nama: user.name,
            email: user.email,
            telepon: user.phone,
            gender: user.gender,
            status: 'pending',
            tanggalDaftar: new Date(user.catalog_request_date).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }),
            tanggalRegistrasi: new Date(user.createdAt).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
            }),
            usaha: 'Kontributor Katalog Ikan • Indonesia',
            jenisKontribusi: 'Database Katalog Ikan',
            pengalaman: 'Pengguna Fishmap AI',
            daysWaiting: Math.floor((new Date() - new Date(user.catalog_request_date)) / (1000 * 60 * 60 * 24)),
            dokumen: ['Verifikasi Email', 'Account Aktif'],
            fotoKtp: user.ktp_image_url || null, // ⭐ TAMBAHKAN INI
            ktpPath: user.ktp_image_path || null  // ⭐ TAMBAHKAN INI
        }));

        res.status(200).json({
            msg: "Pending catalog requests berhasil diambil",
            data: formattedRequests,
            total: formattedRequests.length
        });

    } catch (error) {
        console.error('Error fetching pending catalog requests:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ ADMIN: Process catalog request (for future manual approval)
export const processCatalogRequest = async (req, res) => {
    try {
        const adminId = req.adminId;
        const { userId } = req.params;
        const { action, rejection_reason } = req.body;

        // Validasi input
        if (!['approve', 'reject'].includes(action)) {
            return res.status(400).json({
                msg: "Action harus 'approve' atau 'reject'"
            });
        }

        // Cek admin permission
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(403).json({
                msg: "Akses ditolak. Admin tidak ditemukan"
            });
        }

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Process request
        if (action === 'approve') {
            await user.update({
                role: 'contributor',
                catalog_request_status: 'approved',
                catalog_approved_date: new Date(),
                catalog_approved_by: adminId,
                catalog_rejection_reason: null
            });

            res.status(200).json({
                msg: `Request catalog access untuk ${user.name} berhasil disetujui`,
                data: {
                    user_id: user.id,
                    user_name: user.name,
                    new_role: 'contributor',
                    approved_by: admin.name,
                    approved_date: new Date()
                }
            });

        } else { // reject
            await user.update({
                role: 'user',
                catalog_request_status: 'rejected',
                catalog_rejection_reason: rejection_reason,
                catalog_approved_date: null,
                catalog_approved_by: null
            });

            res.status(200).json({
                msg: `Request catalog access untuk ${user.name} ditolak`,
                data: {
                    user_id: user.id,
                    user_name: user.name,
                    rejection_reason: rejection_reason,
                    rejected_by: admin.name
                }
            });
        }

    } catch (error) {
        console.error('Error processing catalog request:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ GET CATALOG STATISTICS
export const getCatalogStatistics = async (req, res) => {
    try {
        const totalUsers = await Users.count();
        const totalContributors = await Users.count({ where: { role: 'contributor' } });
        const pendingRequests = await Users.count({ where: { catalog_request_status: 'pending' } });
        const approvedRequests = await Users.count({ where: { catalog_request_status: 'approved' } });
        const rejectedRequests = await Users.count({ where: { catalog_request_status: 'rejected' } });

        const totalCatalogEntries = await FishPredictions.count({
            where: { namaIkan: { [Op.ne]: null } }
        });
        const totalPredictions = await FishPredictions.count();

        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const recentRequests = await Users.count({
            where: {
                catalog_request_date: { [Op.gte]: weekAgo }
            }
        });

        res.status(200).json({
            msg: "Statistik katalog berhasil diambil",
            data: {
                users: {
                    total: totalUsers,
                    contributors: totalContributors,
                    recent_requests: recentRequests
                },
                requests: {
                    pending: pendingRequests,
                    approved: approvedRequests,
                    rejected: rejectedRequests,
                    total: pendingRequests + approvedRequests + rejectedRequests
                },
                catalog: {
                    total_entries: totalCatalogEntries,
                    total_predictions: totalPredictions,
                    conversion_rate: totalPredictions > 0 ? ((totalCatalogEntries / totalPredictions) * 100).toFixed(2) + '%' : '0%'
                },
                system: {
                    manual_approval: true,
                    auto_approval: false
                }
            }
        });

    } catch (error) {
        console.error('Error fetching catalog statistics:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ UPDATED: Admin approve catalog request WITH EMAIL
export const approveCatalogRequest = async (req, res) => {
    try {
        const adminId = req.adminId;
        const { userId } = req.params;

        // Cek admin permission
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(403).json({
                msg: "Akses ditolak. Admin tidak ditemukan"
            });
        }

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Cek apakah ada pending request
        if (user.catalog_request_status !== 'pending') {
            return res.status(400).json({
                msg: "User tidak memiliki pending catalog request"
            });
        }

        // Approve request
        await user.update({
            role: 'contributor',
            catalog_request_status: 'approved',
            catalog_approved_date: new Date(),
            catalog_approved_by: adminId,
            catalog_rejection_reason: null
        });

        console.log(`✅ Catalog request approved for user: ${user.name} by admin: ${admin.name}`);

        // ⭐ SEND APPROVAL EMAIL
        try {
            console.log('📧 Sending approval email to:', user.email);
            const emailResult = await sendCatalogApprovedEmail(user.email, user.name);

            if (emailResult.success) {
                console.log('✅ Approval email sent successfully:', emailResult.messageId);
            } else {
                console.log('⚠️ Failed to send approval email');
            }
        } catch (emailError) {
            console.error('⚠️ Error sending approval email:', emailError.message);
            // Don't fail the whole approval process if email fails
        }

        res.status(200).json({
            msg: `Request catalog access untuk ${user.name} berhasil disetujui`,
            data: {
                user_id: user.id,
                user_name: user.name,
                user_email: user.email,
                new_role: 'contributor',
                approved_by: admin.name,
                approved_date: new Date(),
                email_sent: true // Indicate email was attempted
            }
        });

    } catch (error) {
        console.error('Error approving catalog request:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ UPDATED: Admin reject catalog request WITH EMAIL
export const rejectCatalogRequest = async (req, res) => {
    try {
        const adminId = req.adminId;
        const { userId } = req.params;
        const { rejection_reason } = req.body;

        if (!rejection_reason) {
            return res.status(400).json({
                msg: "Alasan penolakan harus diisi"
            });
        }

        // Cek admin permission
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(403).json({
                msg: "Akses ditolak. Admin tidak ditemukan"
            });
        }

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Cek apakah ada pending request
        if (user.catalog_request_status !== 'pending') {
            return res.status(400).json({
                msg: "User tidak memiliki pending catalog request"
            });
        }

        // Reject request
        await user.update({
            catalog_request_status: 'rejected',
            catalog_rejection_reason: rejection_reason,
            catalog_approved_date: null,
            catalog_approved_by: null
        });

        console.log(`❌ Catalog request rejected for user: ${user.name} by admin: ${admin.name}`);

        // ⭐ SEND REJECTION EMAIL
        try {
            console.log('📧 Sending rejection email to:', user.email);
            const emailResult = await sendCatalogRejectedEmail(user.email, user.name, rejection_reason);

            if (emailResult.success) {
                console.log('✅ Rejection email sent successfully:', emailResult.messageId);
            } else {
                console.log('⚠️ Failed to send rejection email');
            }
        } catch (emailError) {
            console.error('⚠️ Error sending rejection email:', emailError.message);
            // Don't fail the whole rejection process if email fails
        }

        res.status(200).json({
            msg: `Request catalog access untuk ${user.name} ditolak`,
            data: {
                user_id: user.id,
                user_name: user.name,
                user_email: user.email,
                rejection_reason: rejection_reason,
                rejected_by: admin.name,
                rejected_date: new Date(),
                email_sent: true // Indicate email was attempted
            }
        });

    } catch (error) {
        console.error('Error rejecting catalog request:', error);
        res.status(500).json({ msg: "Server error" });
    }


};

export const uploadKTP = async (req, res) => {
    try {
        const userId = req.userId;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ msg: "File KTP harus diupload" });
        }

        // Tambah validasi tipe file
        if (!file.mimetype.startsWith('image/')) {
            return res.status(400).json({ msg: "File harus berupa gambar (jpg/png)" });
        }

        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
        await user.update({
            ktp_image_path: file.path,
            ktp_image_url: `${baseUrl}/uploads/${file.filename}`
        });

        res.status(200).json({
            msg: "KTP berhasil diupload",
            ktpUrl: user.ktp_image_url
        });
    } catch (error) {
        console.error('Error uploading KTP:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

