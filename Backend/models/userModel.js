import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Users = db.define("users", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [2, 50]
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [10, 15], // tergantung format no HP
      is: /^[0-9]+$/i
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  gender: {
    type: DataTypes.ENUM("male", "female"),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },

  // ⭐ Field untuk OTP Email Verification
  otp_code: {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: 'Kode OTP 6 digit untuk verifikasi email'
  },
  otp_expires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu expired OTP'
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Status verifikasi email pendaftaran'
  },
  email_verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu email diverifikasi'
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Refresh token untuk login'
  },

  // ⭐ Field untuk Role & Akses Katalog  
  role: {
    type: DataTypes.ENUM('user', 'contributor', 'admin'),
    allowNull: false,
    defaultValue: 'user',
    comment: 'user=prediksi saja, contributor=bisa submit katalog, admin=approve semua'
  },
  catalog_request_status: {
    type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'none',
    comment: 'Status request akses katalog'
  },
  catalog_request_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal request akses katalog'
  },
  catalog_approved_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Tanggal disetujui akses katalog'
  },
  catalog_approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang menyetujui akses katalog'
  },
  catalog_rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Alasan rejection akses katalog'
  },
  ktp_image_path: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Path file gambar KTP'
  },
  ktp_image_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'URL akses gambar KTP'
  }
}, {
  freezeTableName: true
});

// ⭐ Instance Methods untuk cek akses
Users.prototype.canAccessCatalog = function () {
  return this.role === 'contributor' || this.role === 'admin';
};

Users.prototype.canApproveCatalog = function () {
  return this.role === 'admin';
};

Users.prototype.isEmailVerified = function () {
  return this.is_verified === true;
};

// ⭐ Static Methods untuk query berdasarkan role
Users.getContributors = function () {
  return this.findAll({
    where: {
      role: ['contributor', 'admin']
    }
  });
};

Users.getPendingCatalogRequests = function () {
  return this.findAll({
    where: {
      catalog_request_status: 'pending'
    },
    order: [['catalog_request_date', 'ASC']]
  });
};

export default Users;