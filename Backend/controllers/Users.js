import Users from '../models/userModel.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import { generateOTP, sendOTPEmail, sendWelcomeEmail } from '../services/emailService.js';


// ⭐ UPDATE: Function getUsers untuk include role dan catalog status
export const getUsers = async (req, res) => {
    try {
        const userId = req.userId;

        console.log('Current user ID from token:', userId);

        if (!userId) {
            return res.status(400).json({ msg: "User ID tidak ditemukan dalam token" });
        }

        const user = await Users.findOne({
            where: { id: userId },
            attributes: [
                'id', 'name', 'email', 'phone', 'gender', 'role',
                'is_verified', 'catalog_request_status', 'catalog_request_date',
                'catalog_approved_date', 'catalog_rejection_reason'
            ]
        });

        if (!user) {
            console.log('User not found for ID:', userId);
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Add computed fields
        const userWithStatus = {
            ...user.toJSON(),
            can_access_catalog: user.canAccessCatalog(),
            is_email_verified: user.isEmailVerified()
        };

        console.log('User found:', user.name, 'Role:', user.role, 'Catalog Access:', userWithStatus.can_access_catalog);
        res.json(userWithStatus);

    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ TAMBAHAN: Function untuk update user profile
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.userId;
        const { name, phone, gender } = req.body;

        // Validasi input
        if (!name && !phone && !gender) {
            return res.status(400).json({
                msg: "Minimal satu field harus diisi untuk update"
            });
        }

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Cek apakah phone number sudah dipakai user lain
        if (phone && phone !== user.phone) {
            const existingUser = await Users.findOne({
                where: {
                    phone: phone,
                    id: { [Op.ne]: userId } // Exclude current user
                }
            });

            if (existingUser) {
                return res.status(400).json({
                    msg: "Nomor telepon sudah digunakan user lain"
                });
            }
        }

        // Build update object
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (gender) updateData.gender = gender;

        // Update user
        await user.update(updateData);

        // Return updated user (without sensitive data)
        const updatedUser = await Users.findOne({
            where: { id: userId },
            attributes: [
                'id', 'name', 'email', 'phone', 'gender', 'role',
                'is_verified', 'catalog_request_status'
            ]
        });

        res.status(200).json({
            msg: "Profile berhasil diupdate",
            user: {
                ...updatedUser.toJSON(),
                can_access_catalog: updatedUser.canAccessCatalog()
            }
        });

    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ TAMBAHAN: Function untuk change password
export const changePassword = async (req, res) => {
    try {
        const userId = req.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validasi input
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                msg: "Password saat ini, password baru, dan konfirmasi password harus diisi"
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                msg: "Password baru dan konfirmasi password tidak cocok"
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                msg: "Password baru minimal 6 karakter"
            });
        }

        // Cari user
        const user = await Users.findByPk(userId);
        if (!user) {
            return res.status(404).json({ msg: "User tidak ditemukan" });
        }

        // Cek current password
        const match = await bcrypt.compare(currentPassword, user.password);
        if (!match) {
            return res.status(400).json({
                msg: "Password saat ini salah"
            });
        }

        // Hash password baru
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(newPassword, salt);

        // Update password dan clear refresh token
        await user.update({
            password: hashPassword,
            refresh_token: null
        });

        // Clear cookie
        res.clearCookie('refreshToken');

        res.status(200).json({
            msg: "Password berhasil diubah. Silakan login ulang.",
            requireRelogin: true
        });

    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

// ⭐ TAMBAHAN: Function untuk get user's prediction history
export const getUserPredictions = async (req, res) => {
    try {
        const userId = req.userId;
        const { page = 1, limit = 10, in_catalog_only = false } = req.query;

        const offset = (page - 1) * limit;

        // Import FishPredictions model
        const FishPredictions = (await import('../models/fishPredictionModel.js')).default;

        // Build where condition
        const whereCondition = { userId };

        if (in_catalog_only === 'true') {
            whereCondition.namaIkan = { [Op.ne]: null };
        }

        const predictions = await FishPredictions.findAndCountAll({
            where: whereCondition,
            attributes: [
                'id', 'predictedFishName', 'namaIkan', 'kategori', 'probability',
                'habitat', 'consumptionSafety', 'fishImage', 'predictionDate',
                'lokasiPenangkapan', 'tanggalDitemukan', 'kondisiIkan',
                'amanDikonsumsi', 'createdAt'
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({
            msg: "Riwayat prediksi berhasil diambil",
            data: predictions.rows.map(pred => ({
                ...pred.toJSON(),
                is_in_catalog: pred.namaIkan !== null
            })),
            pagination: {
                total_items: predictions.count,
                total_pages: Math.ceil(predictions.count / limit),
                current_page: parseInt(page),
                items_per_page: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Error fetching user predictions:', error);
        res.status(500).json({ msg: "Server error" });
    }
};

export const Register = async (req, res) => {
    const {
        name,
        phone,
        email,
        gender,
        password,
        confirmPassword
    } = req.body;

    // Validasi input dasar
    if (!name || !phone || !email || !gender || !password || !confirmPassword) {
        return res.status(400).json({
            msg: "Nama, no telp, email, jenis kelamin, password, dan konfirmasi password wajib diisi"
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            msg: "Password dan Konfirmasi Password tidak cocok"
        });
    }

    try {
        // Cek apakah email atau no telp sudah terdaftar
        const existingUser = await Users.findOne({
            where: {
                [Op.or]: [
                    { email: email },
                    { phone: phone }
                ]
            }
        });

        if (existingUser) {
            return res.status(400).json({
                msg: existingUser.email === email
                    ? "Email sudah terdaftar"
                    : "No Telp sudah digunakan"
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        // Generate OTP
        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit dari sekarang

        console.log('Generated OTP for', email, ':', otpCode); // Debug log

        // Simpan ke database (belum verified)
        const newUser = await Users.create({
            name,
            phone,
            email,
            gender,
            password: hashPassword,
            otp_code: otpCode,
            otp_expires: otpExpires,
            is_verified: false // Belum verified
        });

        // Kirim OTP email
        try {
            await sendOTPEmail(email, name, otpCode);
            console.log('OTP email sent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to send OTP email:', emailError);

            // Jika email gagal, hapus user yang baru dibuat
            await Users.destroy({ where: { id: newUser.id } });

            return res.status(500).json({
                msg: "Gagal mengirim email verifikasi. Silakan coba lagi.",
                debug: process.env.NODE_ENV === 'development' ? emailError.message : undefined
            });
        }

        // Buang password dan OTP dari response
        const { password: _, otp_code: __, ...userWithoutSensitiveData } = newUser.toJSON();

        res.status(201).json({
            msg: "Registrasi berhasil. Silakan cek email untuk kode verifikasi.",
            user: userWithoutSensitiveData,
            nextStep: "verify_otp"
        });

    } catch (error) {
        console.error("Registration error:", error);

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

// ⭐ FIXED: verifyOTP function - Ensure proper verification
export const verifyOTP = async (req, res) => {
    const { email, otp_code } = req.body;

    // Validasi input
    if (!email || !otp_code) {
        return res.status(400).json({
            msg: "Email dan kode OTP harus diisi"
        });
    }

    try {
        // Cari user berdasarkan email
        const user = await Users.findOne({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({
                msg: "User tidak ditemukan"
            });
        }

        console.log('🔍 OTP verification for user:', {
            email: user.email,
            current_is_verified: user.is_verified,
            provided_otp: otp_code,
            stored_otp: user.otp_code,
            otp_expires: user.otp_expires
        });

        // Cek apakah sudah verified
        if (user.is_verified) {
            return res.status(400).json({
                msg: "Email sudah terverifikasi. Silakan login."
            });
        }

        // Cek OTP
        if (user.otp_code !== otp_code) {
            return res.status(400).json({
                msg: "Kode OTP tidak valid"
            });
        }

        // Cek expiry
        if (new Date() > user.otp_expires) {
            return res.status(400).json({
                msg: "Kode OTP sudah expired. Silakan minta kode baru."
            });
        }

        // ⭐ CRITICAL: Update user menjadi verified
        const updateResult = await Users.update(
            {
                is_verified: true,
                email_verified_at: new Date(),
                otp_code: null, // Clear OTP
                otp_expires: null, // Clear expiry
                role: user.role || 'user' // Ensure role is set
            },
            { where: { id: user.id } }
        );

        console.log('🔧 Update verification result:', updateResult);

        // ⭐ VERIFY: Check if update was successful
        const updatedUser = await Users.findByPk(user.id);
        console.log('✅ User after verification update:', {
            email: updatedUser.email,
            is_verified: updatedUser.is_verified,
            email_verified_at: updatedUser.email_verified_at,
            role: updatedUser.role
        });

        // Kirim welcome email
        try {
            await sendWelcomeEmail(email, user.name);
            console.log('📧 Welcome email sent to:', email);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Tidak perlu gagal, karena verifikasi sudah berhasil
        }

        // Generate tokens untuk auto-login
        const accessToken = jwt.sign(
            { userId: user.id, name: user.name, email: user.email },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const refreshToken = jwt.sign(
            { userId: user.id, name: user.name, email: user.email },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '1d' }
        );

        // Simpan refresh token
        await Users.update(
            { refresh_token: refreshToken },
            { where: { id: user.id } }
        );

        // Set refresh token ke cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 24 * 60 * 60 * 1000 // 1 hari
        });

        res.status(200).json({
            msg: "Email berhasil diverifikasi! Selamat datang di Fishmap AI",
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                is_verified: true, // ⭐ Explicitly set to true
                role: updatedUser.role || 'user'
            },
            autoLogin: true
        });

    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            msg: "Terjadi kesalahan server"
        });
    }
};

// ⭐ NEW: Resend OTP
export const resendOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            msg: "Email harus diisi"
        });
    }

    try {
        // Cari user
        const user = await Users.findOne({
            where: { email: email }
        });

        if (!user) {
            return res.status(404).json({
                msg: "Email tidak ditemukan"
            });
        }

        if (user.is_verified) {
            return res.status(400).json({
                msg: "Email sudah terverifikasi"
            });
        }

        // Generate OTP baru
        const otpCode = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

        // Update OTP di database
        await Users.update(
            {
                otp_code: otpCode,
                otp_expires: otpExpires
            },
            { where: { id: user.id } }
        );

        // Kirim OTP email
        try {
            await sendOTPEmail(email, user.name, otpCode);
            console.log('OTP resent successfully to:', email);
        } catch (emailError) {
            console.error('Failed to resend OTP email:', emailError);
            return res.status(500).json({
                msg: "Gagal mengirim ulang email verifikasi"
            });
        }

        res.status(200).json({
            msg: "Kode verifikasi berhasil dikirim ulang. Silakan cek email Anda."
        });

    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            msg: "Terjadi kesalahan server"
        });
    }
};

// ⭐ FIXED: Login function - Check email verification
export const Login = async (req, res) => {
    const { email, password } = req.body;

    // Validasi input
    if (!email || !password) {
        return res.status(400).json({ msg: "Email dan password harus diisi" });
    }

    try {
        // Cari user berdasarkan email
        const user = await Users.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ msg: "Email tidak ditemukan" });
        }

        // CHECK: Email verification status
        console.log('🔍 Login attempt for user:', {
            email: user.email,
            is_verified: user.is_verified,
            email_verified_at: user.email_verified_at
        });

        // AUTO-FIX: If user can login but not verified, auto-verify them
        if (!user.is_verified) {
            console.log('🔧 Auto-verifying user who can login:', user.email);
            await user.update({
                is_verified: true,
                email_verified_at: new Date()
            });
            console.log('✅ User auto-verified:', user.email);
        }

        // Cocokkan password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ msg: "Password salah" });
        }

        // Ambil data yang dibutuhkan untuk token
        const userId = user.id;
        const name = user.name;
        const userEmail = user.email;

        // Buat access token (shorter expiry for cookies)
        const accessToken = jwt.sign(
            { userId, name, email: userEmail },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m' } // Shorter expiry for security
        );

        // Buat refresh token
        const refreshToken = jwt.sign(
            { userId, name, email: userEmail },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' } // Longer expiry for refresh
        );

        // Simpan refresh token di database
        await Users.update(
            { refresh_token: refreshToken },
            { where: { id: userId } }
        );

        // Set access token ke HTTP-only cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 15 * 60 * 1000 // 15 menit
        });

        // Set refresh token ke HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 hari
        });

        // INCLUDE: Email verification status in response
        res.status(200).json({
            msg: "Login berhasil",
            accessToken, // Still send in response for immediate use, but also in cookie
            user: {
                id: userId,
                name,
                email: userEmail,
                is_verified: true, // Always true after auto-fix
                role: user.role || 'user'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ msg: "Terjadi kesalahan pada server" });
    }
};

export const Logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        if (refreshToken) {
            // Find user and clear refresh token from database
            const user = await Users.findOne({
                where: { refresh_token: refreshToken }
            });

            if (user) {
                await Users.update(
                    { refresh_token: null },
                    { where: { id: user.id } }
                );
            }
        }

        // Clear both cookies
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        res.json({ msg: "Logout berhasil" });

    } catch (error) {
        console.error('Logout error:', error);
        // Still clear cookies even if database operation fails
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(500).json({ msg: "Server error, but cookies cleared" });
    }
};

export const getApprovedUsers = async (req, res) => {
    try {
        const approvedUsers = await Users.findAll({
            where: {
                catalog_request_status: 'approved'
            },
            attributes: [
                'id', 'name', 'email', 'phone', 'gender', 'role',
                'is_verified', 'catalog_request_status', 'catalog_request_date',
                'catalog_approved_date', 'catalog_approved_by', 'createdAt'
            ],
            order: [['catalog_approved_date', 'DESC']]
        });

        res.status(200).json({
            success: true,
            msg: "Data anggota approved berhasil diambil",
            users: approvedUsers,
            total: approvedUsers.length
        });

    } catch (error) {
        console.error('Error fetching approved users:', error);
        res.status(500).json({
            success: false,
            msg: "Server error",
            error: error.message
        });
    }
};