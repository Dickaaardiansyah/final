import Admin from '../models/adminModel.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';

// ⭐ GET ADMIN PROFILE (yang sedang login)
export const getAdmin = async (req, res) => {
    try {
        // Ambil adminId dari token
        const adminId = req.adminId;

        console.log('Current admin ID from token:', adminId); // Debug log

        if (!adminId) {
            return res.status(400).json({ msg: "Admin ID tidak ditemukan dalam token" });
        }

        // Return data admin yang sedang login saja
        const admin = await Admin.findOne({
            where: { id: adminId },
            attributes: [
                'id', 'name', 'email', 'phone', 'gender', 'role', 'status', 'last_login'
            ]
        });

        if (!admin) {
            console.log('Admin not found for ID:', adminId);
            return res.status(404).json({ msg: "Admin tidak ditemukan" });
        }

        console.log('Admin found:', admin.name, 'Role:', admin.role, 'Status:', admin.status);
        res.json(admin); // Return single object

    } catch (error) {
        console.error('Error fetching admin:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ CREATE ADMIN MANUAL (via API/Postman - tidak ada OTP)
export const createAdmin = async (req, res) => {
    const {
        name,
        phone,
        email,
        gender,
        password,
        role = 'catalog_moderator' // Default role
    } = req.body;

    // Validasi input dasar
    if (!name || !phone || !email || !gender || !password) {
        return res.status(400).json({
            msg: "Nama, no telp, email, jenis kelamin, dan password wajib diisi"
        });
    }

    // Validasi role
    const allowedRoles = ['super_admin', 'seller_verifier', 'admin'];
    if (!allowedRoles.includes(role)) {
        return res.status(400).json({
            msg: "Role tidak valid. Role yang diizinkan: " + allowedRoles.join(', ')
        });
    }

    try {
        // Cek apakah email atau no telp sudah terdaftar
        const existingAdmin = await Admin.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { phone: phone }
                ]
            }
        });

        if (existingAdmin) {
            return res.status(400).json({
                msg: existingAdmin.email === email
                    ? "Email sudah terdaftar"
                    : "No Telp sudah digunakan"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        console.log('Creating admin:', email); // Debug log

        // Simpan ke database (langsung aktif, tidak perlu verifikasi)
        const newAdmin = await Admin.create({
            name,
            phone,
            email,
            gender,
            password: hashPassword,
            role,
            status: 'active', // Langsung aktif
            created_by: req.adminId || null // Track siapa yang buat admin ini jika ada
        });

        console.log('Admin created successfully:', newAdmin.email);

        // Buang password dari response
        const { password: _, ...adminWithoutPassword } = newAdmin.toJSON();

        res.status(201).json({
            msg: "Admin berhasil dibuat dan siap untuk login",
            admin: adminWithoutPassword
        });

    } catch (error) {
        console.error("Admin creation error:", error);

        if (error.name === "SequelizeValidationError") {
            return res.status(400).json({
                msg: "Data tidak valid",
                errors: error.errors.map(e => ({
                    field: e.path,
                    message: e.message
                }))
            });
        }

        res.status(500).json({
            msg: "Terjadi kesalahan server"
        });
    }
};

// ⭐ TAMBAHAN: Function baru untuk admin dashboard stats
export const getAdminDashboardStats = async (req, res) => {
    try {
        const adminId = req.adminId;
        
        // Cek admin permission
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ msg: "Admin tidak ditemukan" });
        }

        // Import Users model untuk stats
        const Users = (await import('../models/userModel.js')).default;
        const FishPredictions = (await import('../models/fishPredictionModel.js')).default;

        // Get statistics
        const stats = await Promise.all([
            // Total users
            Users.count(),
            
            // Users by role
            Users.count({ where: { role: 'user' } }),
            Users.count({ where: { role: 'contributor' } }),
            
            // Pending catalog requests
            Users.count({ where: { catalog_request_status: 'pending' } }),
            
            // Total predictions
            FishPredictions.count(),
            
            // Catalog entries (predictions saved to catalog)
            FishPredictions.count({ 
                where: { 
                    namaIkan: { [Op.ne]: null } 
                } 
            })
        ]);

        const [
            totalUsers,
            regularUsers, 
            contributors,
            pendingRequests,
            totalPredictions,
            catalogEntries
        ] = stats;

        res.status(200).json({
            msg: "Dashboard stats berhasil diambil",
            data: {
                users: {
                    total: totalUsers,
                    regular: regularUsers,
                    contributors: contributors,
                    pending_requests: pendingRequests
                },
                predictions: {
                    total: totalPredictions,
                    in_catalog: catalogEntries
                },
                admin_info: {
                    name: admin.name,
                    role: admin.role,
                    permissions: admin.permissions || Admin.getDefaultPermissions(admin.role)
                }
            }
        });

    } catch (error) {
        console.error('Error fetching admin dashboard stats:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ TAMBAHAN: Function untuk get admin permissions
export const getAdminPermissions = async (req, res) => {
    try {
        const adminId = req.adminId;
        
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            return res.status(404).json({ msg: "Admin tidak ditemukan" });
        }

        const permissions = {
            can_approve_catalog_requests: admin.canApproveCatalogRequests(),
            can_manage_users: admin.canManageUsers(),
            can_manage_admins: admin.canManageAdmins(),
            can_moderate_content: admin.canModerateContent(),
            role: admin.role,
            status: admin.status
        };

        res.status(200).json({
            msg: "Admin permissions berhasil diambil",
            data: permissions
        });

    } catch (error) {
        console.error('Error fetching admin permissions:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ LOGIN ADMIN (sederhana tanpa OTP verification)
export const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        return res.status(400).json({ msg: "Email dan password harus diisi" });
    }

    try {
        // Cari admin berdasarkan email
        const admin = await Admin.findOne({ where: { email } });

        if (!admin) {
            return res.status(404).json({ msg: "Email admin tidak ditemukan" });
        }

        // Cek status admin
        if (admin.status !== 'active') {
            return res.status(403).json({ 
                msg: `Akun admin ${admin.status}. Hubungi super admin untuk mengaktifkan.` 
            });
        }

        // Cocokkan password
        const match = await bcrypt.compare(password, admin.password);
        if (!match) {
            return res.status(400).json({ msg: "Password salah" });
        }

        // Ambil data yang dibutuhkan untuk token
        const adminId = admin.id;
        const name = admin.name;
        const adminEmail = admin.email;
        const role = admin.role;

        // Buat access token (8 jam untuk admin)
        const accessToken = jwt.sign(
            { adminId, name, email: adminEmail, role },
            process.env.ADMIN_ACCESS_TOKEN_SECRET || process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '8h' }
        );

        // Buat refresh token (7 hari untuk admin)
        const refreshToken = jwt.sign(
            { adminId, name, email: adminEmail, role },
            process.env.ADMIN_REFRESH_TOKEN_SECRET || process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        // Update refresh token di database (hook akan auto update last_login)
        await Admin.update(
            { refresh_token: refreshToken },
            { where: { id: adminId } }
        );

        // Set refresh token ke cookie
        res.cookie('adminRefreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
        });

        // Kirim access token dan info admin
        res.status(200).json({
            msg: "Login admin berhasil",
            accessToken,
            admin: {
                id: adminId,
                name,
                email: adminEmail,
                role,
                status: admin.status,
                last_login: new Date()
            }
        });

    } catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

// ⭐ LOGOUT ADMIN
export const logoutAdmin = async (req, res) => {
    const refreshToken = req.cookies.adminRefreshToken;
    if (!refreshToken) return res.sendStatus(204); // No Content

    try {
        // Cari admin dengan refresh token
        const admin = await Admin.findOne({
            where: {
                refresh_token: refreshToken
            }
        });

        // Jika admin tidak ditemukan, tetap clear cookie
        if (!admin) return res.sendStatus(204);

        const adminId = admin.id;

        // Clear refresh token di database
        await Admin.update(
            { refresh_token: null },
            { where: { id: adminId } }
        );

        // Clear cookie
        res.clearCookie('adminRefreshToken');
        res.json({ msg: "Logout admin berhasil" });

    } catch (error) {
        console.error('Admin logout error:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ GET ALL ADMINS (hanya super_admin yang bisa akses)
export const getAllAdmins = async (req, res) => {
    try {
        // Cek role admin yang request
        const currentAdminId = req.adminId;
        const currentAdmin = await Admin.findByPk(currentAdminId);

        if (!currentAdmin || currentAdmin.role !== 'super_admin') {
            return res.status(403).json({
                msg: "Akses ditolak. Hanya super admin yang bisa melihat daftar admin."
            });
        }

        const admins = await Admin.findAll({
            attributes: [
                'id', 'name', 'email', 'phone', 'gender', 'role', 'status', 
                'last_login', 'createdAt'
            ],
            include: [
                {
                    model: Admin,
                    as: 'creator',
                    attributes: ['id', 'name'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            msg: "Daftar admin berhasil diambil",
            data: admins,
            total: admins.length
        });

    } catch (error) {
        console.error('Error fetching all admins:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ UPDATE ADMIN STATUS (hanya super_admin)
export const updateAdminStatus = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { status } = req.body;
        const currentAdminId = req.adminId;

        // Cek role admin yang request
        const currentAdmin = await Admin.findByPk(currentAdminId);
        if (!currentAdmin || currentAdmin.role !== 'super_admin') {
            return res.status(403).json({
                msg: "Akses ditolak. Hanya super admin yang bisa mengubah status admin."
            });
        }

        // Validasi status
        const allowedStatuses = ['active', 'inactive', 'suspended'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                msg: "Status tidak valid. Status yang diizinkan: " + allowedStatuses.join(', ')
            });
        }

        // Cek admin target
        const targetAdmin = await Admin.findByPk(adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                msg: "Admin tidak ditemukan"
            });
        }

        // Tidak bisa mengubah status diri sendiri
        if (parseInt(adminId) === currentAdminId) {
            return res.status(400).json({
                msg: "Tidak bisa mengubah status diri sendiri"
            });
        }

        // Update status
        await Admin.update(
            { status: status },
            { 
                where: { id: adminId },
                adminId: currentAdminId // Untuk tracking updated_by via hook
            }
        );

        res.json({
            msg: `Status admin ${targetAdmin.name} berhasil diubah menjadi ${status}`,
            data: {
                adminId: targetAdmin.id,
                name: targetAdmin.name,
                status: status
            }
        });

    } catch (error) {
        console.error('Error updating admin status:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ UPDATE ADMIN PASSWORD (self atau super_admin)
export const updateAdminPassword = async (req, res) => {
    try {
        const { adminId } = req.params;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const requestingAdminId = req.adminId;

        // Validasi input
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                msg: "Password baru dan konfirmasi password harus diisi"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                msg: "Password baru dan konfirmasi password tidak cocok"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                msg: "Password minimal 6 karakter"
            });
        }

        // Cek admin target
        const targetAdmin = await Admin.findByPk(adminId);
        if (!targetAdmin) {
            return res.status(404).json({
                msg: "Admin tidak ditemukan"
            });
        }

        // Cek admin yang request
        const requestingAdmin = await Admin.findByPk(requestingAdminId);

        // Jika bukan diri sendiri, harus super admin
        if (parseInt(adminId) !== requestingAdminId && requestingAdmin.role !== 'super_admin') {
            return res.status(403).json({
                msg: "Anda hanya bisa mengubah password sendiri atau harus super admin"
            });
        }

        // Jika mengubah password sendiri, harus masukkan current password
        if (parseInt(adminId) === requestingAdminId) {
            if (!currentPassword) {
                return res.status(400).json({
                    msg: "Password saat ini harus diisi"
                });
            }

            const match = await bcrypt.compare(currentPassword, targetAdmin.password);
            if (!match) {
                return res.status(400).json({
                    msg: "Password saat ini salah"
                });
            }
        }

        // Hash password baru
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await Admin.update(
            { 
                password: hashPassword,
                refresh_token: null // Clear refresh token untuk force re-login
            },
            { 
                where: { id: adminId },
                adminId: requestingAdminId // Untuk tracking updated_by
            }
        );

        res.json({
            msg: "Password admin berhasil diubah. Silakan login ulang.",
            data: {
                adminId: targetAdmin.id,
                name: targetAdmin.name
            }
        });

    } catch (error) {
        console.error('Error updating admin password:', error);
        res.status(500).json({ msg: "Server error" });
    }
};