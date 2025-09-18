import { Sequelize } from "sequelize";
import db from "../config/Database.js";

const { DataTypes } = Sequelize;

const Admin = db.define("admins", {
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
  
  // ⭐ Role Admin untuk Catalog Management
  role: {
    type: DataTypes.ENUM("super_admin", "catalog_moderator", "admin"),
    allowNull: false,
    defaultValue: "catalog_moderator",
    comment: 'Role admin: super_admin (semua akses), catalog_moderator (approve catalog requests), admin (basic)'
  },
  
  // ⭐ Permissions untuk granular access control
  permissions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      approve_catalog_requests: true,
      manage_users: false,
      manage_admins: false,
      view_analytics: true,
      moderate_content: true
    },
    comment: 'JSON object untuk granular permissions'
  },
  
  // ⭐ Status Admin
  status: {
    type: DataTypes.ENUM("active", "inactive", "suspended"),
    allowNull: false,
    defaultValue: "active",
    comment: 'Status admin: active, inactive, suspended'
  },
  
  // ⭐ Session Management
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Refresh token untuk login'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Waktu login terakhir'
  },
  
  // ⭐ Audit Trail
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang membuat record ini'
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID admin yang terakhir mengupdate'
  }
}, {
  freezeTableName: true,
  
  // ⭐ Hooks untuk auto-update created_by dan updated_by
  hooks: {
    beforeCreate: (admin, options) => {
      if (options.adminId) {
        admin.created_by = options.adminId;
      }
      
      // Set default permissions berdasarkan role
      if (!admin.permissions) {
        admin.permissions = Admin.getDefaultPermissions(admin.role);
      }
    },
    beforeUpdate: (admin, options) => {
      if (options.adminId) {
        admin.updated_by = options.adminId;
      }
      
      // Update last login saat login berhasil
      if (admin.changed('refresh_token') && admin.refresh_token) {
        admin.last_login = new Date();
      }
    }
  }
});

// ⭐ Instance Methods untuk permission checking
Admin.prototype.canApproveCatalogRequests = function() {
  return this.status === 'active' && 
         (this.role === 'super_admin' || 
          this.role === 'catalog_moderator' || 
          this.permissions?.approve_catalog_requests === true);
};

Admin.prototype.canManageUsers = function() {
  return this.status === 'active' && 
         (this.role === 'super_admin' || 
          this.permissions?.manage_users === true);
};

Admin.prototype.canManageAdmins = function() {
  return this.status === 'active' && 
         (this.role === 'super_admin' || 
          this.permissions?.manage_admins === true);
};

Admin.prototype.canModerateContent = function() {
  return this.status === 'active' && 
         (this.role === 'super_admin' || 
          this.role === 'catalog_moderator' || 
          this.permissions?.moderate_content === true);
};

// ⭐ Static Methods
Admin.getDefaultPermissions = function(role) {
  const permissions = {
    super_admin: {
      approve_catalog_requests: true,
      manage_users: true,
      manage_admins: true,
      view_analytics: true,
      moderate_content: true
    },
    catalog_moderator: {
      approve_catalog_requests: true,
      manage_users: false,
      manage_admins: false,
      view_analytics: true,
      moderate_content: true
    },
    admin: {
      approve_catalog_requests: false,
      manage_users: false,
      manage_admins: false,
      view_analytics: true,
      moderate_content: false
    }
  };
  
  return permissions[role] || permissions.admin;
};

Admin.getActiveModerators = function() {
  return this.findAll({
    where: {
      status: 'active',
      role: ['super_admin', 'catalog_moderator']
    }
  });
};

// ⭐ Self-referencing associations untuk tracking siapa yang buat/update admin
Admin.belongsTo(Admin, { 
  as: 'creator', 
  foreignKey: 'created_by',
  constraints: false 
});

Admin.belongsTo(Admin, { 
  as: 'updater', 
  foreignKey: 'updated_by',
  constraints: false 
});

export default Admin;