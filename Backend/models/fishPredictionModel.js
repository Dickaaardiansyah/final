import { Sequelize } from 'sequelize';
import db from '../config/Database.js';
import Users from './userModel.js';

const { DataTypes } = Sequelize;

const FishPredictions = db.define('katalog_fish', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Users,
      key: 'id'
    }
  },
  predictedFishName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  probability: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  habitat: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  consumptionSafety: {
    type: DataTypes.STRING,
    allowNull: true
  },
  fishImage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  predictionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  predictionTime: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  namaIkan: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Nama ikan yang bisa diedit user'
  },
  kategori: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Kategori ikan: Ikan Konsumsi, Ikan Hias, dll'
  },
  deskripsiTambahan: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Deskripsi tambahan dari user'
  },
  tanggalDitemukan: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Tanggal ikan ditemukan/ditangkap'
  },
  lokasiPenangkapan: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Lokasi penangkapan ikan'
  },
  kondisiIkan: {
    type: DataTypes.ENUM('hidup', 'mati'),
    allowNull: true,
    defaultValue: 'mati',
    comment: 'Kondisi ikan saat ditemukan'
  },
  tingkatKeamanan: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.98,
    comment: 'Tingkat keamanan konsumsi (0-1)'
  },
  amanDikonsumsi: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    comment: 'Apakah ikan aman dikonsumsi'
  },
  jauhDariPabrik: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    defaultValue: true,
    comment: 'Apakah lokasi jauh dari pabrik'
  },
  boxes: { // Kolom baru untuk bounding box
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Bounding box dari YOLO (array koordinat [x1, y1, x2, y2])'
  }
}, {
  freezeTableName: true,
  timestamps: true,
  hooks: {
    beforeCreate: (instance, options) => {
      console.log('🔧 beforeCreate hook triggered');
      if (!instance.namaIkan && instance.predictedFishName) {
        instance.namaIkan = instance.predictedFishName;
        console.log(`✅ Auto-populated namaIkan: ${instance.namaIkan}`);
      }
      if (!instance.kategori) {
        if (instance.consumptionSafety) {
          const safety = instance.consumptionSafety.toLowerCase();
          instance.kategori = safety.includes('aman') || safety.includes('konsumsi') || safety.includes('dimakan')
            ? 'Ikan Konsumsi'
            : 'Ikan Hias';
        } else {
          instance.kategori = 'Ikan Konsumsi';
        }
        console.log(`✅ Auto-populated kategori: ${instance.kategori}`);
      }
      if (instance.amanDikonsumsi === null && instance.consumptionSafety) {
        const safety = instance.consumptionSafety.toLowerCase();
        instance.amanDikonsumsi = safety.includes('aman') || safety.includes('konsumsi') || safety.includes('dimakan');
        console.log(`✅ Auto-populated amanDikonsumsi: ${instance.amanDikonsumsi}`);
      }
    },
    beforeUpdate: (instance, options) => {
      console.log('🔧 beforeUpdate hook triggered');
      if (!instance.namaIkan && instance.predictedFishName) {
        instance.namaIkan = instance.predictedFishName;
        console.log(`✅ Restored namaIkan from predictedFishName: ${instance.namaIkan}`);
      }
    },
    afterCreate: (instance, options) => {
      console.log(`🎉 New fish prediction created:`, {
        id: instance.id,
        predictedFishName: instance.predictedFishName,
        namaIkan: instance.namaIkan,
        kategori: instance.kategori,
        amanDikonsumsi: instance.amanDikonsumsi
      });
    }
  }
});

FishPredictions.belongsTo(Users, {
  foreignKey: 'userId',
  as: 'user'
});

FishPredictions.prototype.isInCatalog = function () {
  return this.namaIkan !== null && this.namaIkan !== undefined && this.namaIkan.trim() !== '';
};

FishPredictions.prototype.getCatalogReadyData = function () {
  return {
    id: this.id,
    namaIkan: this.namaIkan,
    predictedFishName: this.predictedFishName,
    kategori: this.kategori,
    habitat: this.habitat,
    amanDikonsumsi: this.amanDikonsumsi,
    fishImage: this.fishImage,
    contributor: this.user?.name || 'Unknown',
    boxes: this.boxes || []
  };
};

export default FishPredictions;