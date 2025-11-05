import React from 'react';
import { X, Fish, MapPin, Calendar, Target, Shield, AlertCircle, Info, ChefHat, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function FishScanDetailModal({ fishScan, isOpen, onClose }) {
  if (!isOpen || !fishScan) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const safetyPercentage = fishScan.fishData.safety_percentage || 
    (fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 92 : 35);

  const getSafetyLevel = (percentage) => {
    if (percentage >= 81) {
      return {
        level: "Aman untuk Dikonsumsi",
        description: "Ikan ini aman untuk dikonsumsi tanpa batasan khusus",
        color: "#22c55e",
        guidance: "Dapat dikonsumsi dengan berbagai metode masak. Tidak ada batasan khusus untuk kelompok usia tertentu.",
        icon: <Shield size={20} className="safety-icon" />
      };
    } else if (percentage >= 61) {
      return {
        level: "Perlu Perhatian Khusus",
        description: "Konsumsi dengan beberapa tindakan pencegahan",
        color: "#f59e0b",
        guidance: "Hindari konsumsi berlebihan (maks. 2 porsi/minggu). Masak hingga benar-benar matang. Tidak disarankan untuk anak-anak dan ibu hamil.",
        icon: <Info size={20} className="safety-icon" />
      };
    } else if (percentage >= 41) {
      return {
        level: "Dibatasi Konsumsinya",
        description: "Hanya boleh dikonsumsi dalam jumlah terbatas",
        color: "#f97316",
        guidance: "Batasi konsumsi (maks. 1 porsi/minggu). Hindari bagian organ dalam. Masak pada suhu tinggi minimal 10 menit.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    } else if (percentage >= 21) {
      return {
        level: "Diragukan Keamanannya",
        description: "Potensi risiko kesehatan yang signifikan",
        color: "#ef4444",
        guidance: "Hindari konsumsi kecuali dalam keadaan darurat. Jika dikonsumsi, buang semua bagian organ dalam dan kulit. Masak minimal 15 menit pada suhu tinggi.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    } else {
      return {
        level: "Tidak Aman untuk Dikonsumsi",
        description: "Berpotensi menyebabkan keracunan atau masalah kesehatan serius",
        color: "#991b1b",
        guidance: "TIDAK DISARANKAN untuk dikonsumsi. Berpotensi mengandung racun alami atau kontaminan berbahaya yang tidak dapat dihilangkan dengan proses masak biasa.",
        icon: <AlertCircle size={20} className="safety-icon" />
      };
    }
  };

  const safetyInfo = getSafetyLevel(safetyPercentage);

  // Data untuk tab detail - hanya 2 tab
  const detailTabs = [
    {
      id: 'consumption',
      label: 'Konsumsi',
      icon: <ChefHat size={18} />,
      content: (
        <div className="detail-text">
          <div className="consumption-content">
            <h3 className="section-title">Resep Masakan</h3>
            <p className="section-description">
              Berikut adalah resep untuk ikan {fishScan.fishData.name}:
            </p>
            
            <div className="recipe-placeholder">
              <p>Informasi resep akan ditampilkan di sini berdasarkan hasil scan</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'cultivation',
      label: 'Budidaya',
      icon: <Sprout size={18} />,
      content: (
        <div className="detail-text">
          <div className="cultivation-content">
            <h3 className="section-title">Panduan Budidaya</h3>
            <p className="section-description">
              Informasi budidaya untuk ikan {fishScan.fishData.name}:
            </p>
            
            <div className="cultivation-placeholder">
              <p>Informasi budidaya akan ditampilkan di sini berdasarkan hasil scan</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const [activeTab, setActiveTab] = React.useState('consumption');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          role="dialog"
          aria-labelledby="modal-title"
          aria-modal="true"
        >
          <motion.div
            className="modal-content bg-gray-900/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700/50 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="modal-header flex justify-between items-center p-6 border-b border-gray-700">
              <div className="header-content flex flex-col gap-2">
                <h2 id="modal-title" className="modal-title text-2xl font-bold text-white tracking-tight">
                  Detail Hasil Scan
                </h2>
                <div className="scan-id-badge bg-gray-800/50 text-gray-300 text-sm px-3 py-1 rounded-full flex items-center justify-between">
                  <span>ID: {fishScan.id}</span>
                  <button
                    className="close-button ml-2 bg-gray-800/50 text-gray-300 p-1 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={onClose}
                    aria-label="Close modal"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
              <button
                className="close-button bg-gray-800/50 text-gray-300 p-2 rounded-full hover:bg-gray-700 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={onClose}
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body p-6">
              <div className="result-grid grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Section */}
                <motion.div
                  className="image-section rounded-xl overflow-hidden"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="image-container relative">
                    <img
                      src={fishScan.image || "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop"}
                      alt={fishScan.fishData.name}
                      className="result-image w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=250&fit=crop";
                      }}
                    />
                    <div className="image-overlay absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="confidence-badge bg-blue-600/80 text-white px-3 py-1 rounded-full flex items-center gap-2 backdrop-blur-sm">
                        <Target size={16} />
                        <span>{fishScan.fishData.confidence}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Info Section */}
                <motion.div
                  className="info-section flex flex-col gap-6"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                >
                  <div className="info-header flex justify-between items-start">
                    <h3 className="fish-name text-3xl font-bold text-white tracking-tight">
                      {fishScan.fishData.name}
                    </h3>
                    <div
                      className={`consumption-badge px-4 py-2 rounded-full text-sm font-semibold text-white ${
                        fishScan.fishData.konsumsi === 'Dapat dikonsumsi'
                          ? 'bg-gradient-to-r from-green-500 to-green-700'
                          : 'bg-gradient-to-r from-amber-500 to-amber-700'
                      } flex items-center justify-between`}
                    >
                      <span>
                        {fishScan.fishData.konsumsi === 'Dapat dikonsumsi' ? 'Konsumsi' : 'Hias'}
                      </span>
                    </div>
                  </div>

                  <div className="metadata-section bg-gray-800/30 rounded-xl p-4">
                    <motion.div
                      className="metadata-item flex gap-4 py-3 border-b border-gray-700/50 last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.3 }}
                    >
                      <Calendar size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Tanggal Scan</span>
                        <span className="metadata-value text-white font-medium">{formatDate(fishScan.date)}</span>
                      </div>
                    </motion.div>
                    <motion.div
                      className="metadata-item flex gap-4 py-3 border-b border-gray-700/50 last:border-b-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.3 }}
                    >
                      <Fish size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Nama Latin</span>
                        <span className="metadata-value text-white font-medium">{fishScan.fishData.predicted_class}</span>
                      </div>
                    </motion.div>
                    <motion.div
                      className="metadata-item flex gap-4 py-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.3 }}
                    >
                      <MapPin size={18} className="metadata-icon text-blue-500" />
                      <div className="metadata-content">
                        <span className="metadata-label text-gray-400 text-sm">Habitat</span>
                        <span className="metadata-value text-white font-medium">{fishScan.fishData.habitat}</span>
                      </div>
                    </motion.div>
                  </div>

                  {/* Safety Section - Dipindah ke atas tab */}
                  <motion.div
                    className="safety-section bg-gray-800/30 rounded-xl p-4 border-l-4"
                    style={{ borderColor: safetyInfo.color }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                  >
                    <div className="safety-header flex items-center gap-3 mb-4">
                      <div className="safety-icon-container" style={{ color: safetyInfo.color }}>
                        {safetyInfo.icon}
                      </div>
                      <div>
                        <h4 className="safety-title text-lg font-semibold text-white">
                          Tingkat Keamanan Konsumsi
                        </h4>
                        <p className="safety-description text-gray-400 text-sm">
                          {safetyInfo.description}
                        </p>
                      </div>
                      <div className="safety-percentage-badge ml-auto bg-gray-700/50 px-3 py-1 rounded-full">
                        <span className="text-white font-bold">{safetyPercentage}%</span>
                      </div>
                    </div>
                    
                    <div className="safety-meter">
                      <div className="safety-labels flex justify-between text-sm text-gray-400 mb-2">
                        <span>Tidak Aman</span>
                        <span>Aman</span>
                      </div>
                      <div className="safety-bar h-3 bg-gray-700 rounded-full overflow-hidden relative">
                        <motion.div
                          className="safety-progress h-full rounded-full"
                          style={{ backgroundColor: safetyInfo.color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${safetyPercentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>

                    <div className="safety-guidance mt-4 p-3 bg-gray-700/30 rounded-lg">
                      <div className="guidance-header flex items-center gap-2 mb-2 text-amber-400">
                        <Info size={16} />
                        <span className="font-medium text-sm">Panduan Konsumsi:</span>
                      </div>
                      <p className="text-gray-200 text-sm leading-relaxed">{safetyInfo.guidance}</p>
                    </div>
                  </motion.div>

                  {/* Detail Tabs - Hanya 2 tab */}
                  <div className="detail-tabs-container">
                    <div className="detail-tabs">
                      {detailTabs.map(tab => (
                        <button
                          key={tab.id}
                          className={`detail-tab ${activeTab === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          {tab.icon}
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    <div className="detail-content-area">
                      {detailTabs.find(tab => tab.id === activeTab)?.content}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default FishScanDetailModal;