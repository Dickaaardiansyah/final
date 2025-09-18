import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Ditambahkan untuk redirect
import { useAdminAuth } from './auth/AdminAuthContext'; // Ditambahkan
import styles from "../../styles/admin/Dashboard.module.css";

function Verifcard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState(null);
  const [selectedAppData, setSelectedAppData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const { getAuthHeader } = useAdminAuth(); // Ditambahkan
  const navigate = useNavigate(); // Ditambahkan untuk redirect
  const API_BASE_URL = 'http://localhost:5000';

  // ⭐ Load pending requests from API
  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    try {
      const headers = await getAuthHeader(); // Diubah: Gunakan getAuthHeader
      const response = await fetch(`${API_BASE_URL}/api/catalog/admin/pending-requests`, {
        method: 'GET',
        headers,
        credentials: 'include' // Ditambahkan untuk kirim cookie
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📋 Pending requests loaded:', result.data);
        setApplications(result.data || []);
      } else {
        const errorResult = await response.json();
        if (errorResult.needLogin) { // Ditambahkan: Handle needLogin
          navigate('/admin/login');
          return;
        }
        setError(errorResult.msg || 'Gagal memuat data pending requests');
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setError('Gagal terhubung ke server');
      if (error.message === 'No valid access token available') { // Ditambahkan
        navigate('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // ⭐ Approve application
  const approveApplication = async (userId) => {
    if (processingId) return;
    setProcessingId(userId);
    try {
      const headers = await getAuthHeader(); // Diubah: Gunakan getAuthHeader
      const response = await fetch(`${API_BASE_URL}/api/catalog/admin/approve/${userId}`, {
        method: 'POST',
        headers,
        credentials: 'include' // Ditambahkan
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Application approved:', result);
        setApplications(prevApps => prevApps.filter(app => app.id !== userId));
        alert(`✅ Request dari ${result.data.user_name} berhasil disetujui!`);
        showToast(`${result.data.user_name} sekarang menjadi kontributor katalog`, 'success');
      } else {
        console.error('❌ Approval failed:', result);
        if (result.needLogin) { // Ditambahkan
          navigate('/admin/login');
          return;
        }
        alert(`❌ Gagal menyetujui: ${result.msg}`);
      }
    } catch (error) {
      console.error('Error approving application:', error);
      alert('❌ Gagal menyetujui aplikasi. Coba lagi nanti.');
      if (error.message === 'No valid access token available') { // Ditambahkan
        navigate('/admin/login');
      }
    } finally {
      setProcessingId(null);
    }
  };

  // ⭐ Reject application
  const rejectApplication = async () => {
    if (!selectedAppId || !rejectionReason.trim()) {
      alert('Alasan penolakan harus diisi');
      return;
    }
    try {
      const headers = await getAuthHeader(); // Diubah: Gunakan getAuthHeader
      const response = await fetch(`${API_BASE_URL}/api/catalog/admin/reject/${selectedAppId}`, {
        method: 'POST',
        headers,
        credentials: 'include', // Ditambahkan
        body: JSON.stringify({
          rejection_reason: rejectionReason
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('❌ Application rejected:', result);
        setApplications(prevApps => prevApps.filter(app => app.id !== selectedAppId));
        setShowRejectModal(false);
        setSelectedAppId(null);
        setRejectionReason('');
        alert(`❌ Request dari ${result.data.user_name} ditolak.`);
        showToast(`Request ${result.data.user_name} ditolak`, 'warning');
      } else {
        console.error('❌ Rejection failed:', result);
        if (result.needLogin) { // Ditambahkan
          navigate('/admin/login');
          return;
        }
        alert(`❌ Gagal menolak: ${result.msg}`);
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      alert('❌ Gagal menolak aplikasi. Coba lagi nanti.');
      if (error.message === 'No valid access token available') { // Ditambahkan
        navigate('/admin/login');
      }
    }
  };

  // ⭐ Open reject modal
  const openRejectModal = (userId) => {
    setSelectedAppId(userId);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  // ⭐ Close reject modal
  const closeRejectModal = () => {
    setShowRejectModal(false);
    setSelectedAppId(null);
    setRejectionReason('');
  };

  // ⭐ Open detail modal
  const viewDetails = (userId) => {
    const app = applications.find(a => a.id === userId);
    if (app) {
      setSelectedAppData(app);
      setShowDetailModal(true);
    }
  };

  // ⭐ Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedAppData(null);
  };

  // ⭐ Show toast notification
  const showToast = (message, type = 'info') => {
    const colors = {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    };

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 9999;
      max-width: 400px;
      font-weight: 500;
      animation: slideIn 0.3s ease-out;
    `;
    toast.textContent = message;

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  // ⭐ Loading state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#666'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>🔄 Memuat data request...</div>
          <div style={{ fontSize: '14px' }}>Mengambil data dari server...</div>
        </div>
      </div>
    );
  }

  // ⭐ Error state
  if (error) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#dc2626',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ marginBottom: '10px' }}>❌ {error}</div>
          <button
            onClick={loadPendingRequests}
            style={{
              padding: '8px 16px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  // ⭐ Empty state
  if (applications.length === 0) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '200px',
        color: '#666',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>Tidak ada request pending</div>
          <div style={{ fontSize: '14px', opacity: 0.7 }}>Semua request katalog sudah diproses</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.applicationsGrid}>
        {applications.map((app) => (
          <div key={app.id} className={styles.applicationCard}>
            <div className={styles.applicationHeader}>
              <div className={styles.applicantInfo}>
                <div className={styles.applicantAvatar}>
                  {app.nama.split(' ').map((n) => n[0]).join('')}
                </div>
                <div className={styles.applicantDetails}>
                  <h3>{app.nama}</h3>
                  <p>{app.usaha}</p>
                </div>
              </div>
              <div className={`${styles.applicationStatus} ${styles.statusPending}`}>
                Menunggu Review
              </div>
            </div>

            <div className={styles.applicationDetails}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Tanggal Request</span>
                <span className={styles.detailValue}>{app.tanggalDaftar}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Registrasi</span>
                <span className={styles.detailValue}>{app.tanggalRegistrasi}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>No. Telepon</span>
                <span className={styles.detailValue}>{app.telepon || 'Tidak tersedia'}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email</span>
                <span className={styles.detailValue}>{app.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Jenis Kontribusi</span>
                <span className={styles.detailValue}>{app.jenisKontribusi}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Status</span>
                <span className={styles.detailValue}>{app.pengalaman}</span>
              </div>
              {app.daysWaiting > 0 && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Menunggu</span>
                  <span className={styles.detailValue}>
                    {app.daysWaiting} hari
                    {app.daysWaiting > 2 && <span style={{ color: '#f59e0b' }}> ⚠️</span>}
                  </span>
                </div>
              )}
            </div>

            <div className={styles.applicationDocuments}>
              <div className={styles.documentsTitle}>Status Verifikasi:</div>
              <div className={styles.documentsList}>
                {app.dokumen.map((doc, index) => (
                  <div key={index} className={styles.documentItem}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
                    </svg>
                    {doc}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.applicationActions}>
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={() => viewDetails(app.id)}
              >
                Detail
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => openRejectModal(app.id)}
                disabled={processingId === app.id}
              >
                Tolak
              </button>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={() => approveApplication(app.id)}
                disabled={processingId === app.id}
              >
                {processingId === app.id ? '⏳ Memproses...' : 'Setujui'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ⭐ Detail Modal */}
      {showDetailModal && selectedAppData && (
        <div className="modalOverlay">
          <div className="detailModal">
            <div className="modalHeader">
              <h3>Detail Request Akses Katalog</h3>
              <button
                className="modalClose"
                onClick={closeDetailModal}
              >
                ×
              </button>
            </div>
            <div className="modalBody">
              {/* User Info Section */}
              <div className="detailSection">
                <h4>Informasi Pemohon</h4>
                <div className="userInfo">
                  <div className="avatarLarge">
                    {selectedAppData.nama.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="userDetails">
                    <div className="detailRow">
                      <span className="label">Nama Lengkap:</span>
                      <span className="value">{selectedAppData.nama}</span>
                    </div>
                    <div className="detailRow">
                      <span className="label">Email:</span>
                      <span className="value">{selectedAppData.email}</span>
                    </div>
                    <div className="detailRow">
                      <span className="label">No. Telepon:</span>
                      <span className="value">{selectedAppData.telepon || 'Tidak tersedia'}</span>
                    </div>
                    <div className="detailRow">
                      <span className="label">Nama Usaha:</span>
                      <span className="value">{selectedAppData.usaha}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Info Section */}
              <div className="detailSection">
                <h4>Informasi Waktu</h4>
                <div className="detailRow">
                  <span className="label">Tanggal Registrasi:</span>
                  <span className="value">{selectedAppData.tanggalRegistrasi}</span>
                </div>
                <div className="detailRow">
                  <span className="label">Tanggal Request:</span>
                  <span className="value">{selectedAppData.tanggalDaftar}</span>
                </div>
                {selectedAppData.daysWaiting > 0 && (
                  <div className="detailRow">
                    <span className="label">Lama Menunggu:</span>
                    <span className="value">
                      {selectedAppData.daysWaiting} hari
                      {selectedAppData.daysWaiting > 2 && (
                        <span style={{ color: '#f59e0b', marginLeft: '8px' }}>⚠️ Perlu perhatian</span>
                      )}
                    </span>
                  </div>
                )}
              </div>

              {/* KTP Section */}
              <div className="detailSection">
                <h4>Dokumen KTP</h4>
                <div className="ktpContainer">
                  {selectedAppData.fotoKtp ? (
                    <div className="ktpImageWrapper">
                      <img
                        src={selectedAppData.fotoKtp}
                        alt={`KTP ${selectedAppData.nama}`}
                        className="ktpImage"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="ktpError" style={{ display: 'none' }}>
                        <div className="errorIcon">📄</div>
                        <div className="errorText">
                          <div>Foto KTP tidak dapat dimuat</div>
                          <small>URL: {selectedAppData.fotoKtp}</small>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="ktpPlaceholder">
                      <div className="placeholderIcon">📄</div>
                      <div className="placeholderText">Foto KTP tidak tersedia</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Info Section */}
              <div className="detailSection">
                <h4>Informasi Tambahan</h4>
                <div className="detailRow">
                  <span className="label">Jenis Kontribusi:</span>
                  <span className="value">{selectedAppData.jenisKontribusi}</span>
                </div>
                <div className="detailRow">
                  <span className="label">Status/Pengalaman:</span>
                  <span className="value">{selectedAppData.pengalaman}</span>
                </div>
                {selectedAppData.dokumen && selectedAppData.dokumen.length > 0 && (
                  <div className="detailRow">
                    <span className="label">Dokumen Terverifikasi:</span>
                    <div className="documentsList">
                      {selectedAppData.dokumen.map((doc, index) => (
                        <span key={index} className="documentBadge">
                          ✓ {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modalFooter">
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={() => {
                  closeDetailModal();
                  openRejectModal(selectedAppData.id);
                }}
              >
                Tolak Request
              </button>
              <button
                className={`${styles.btn} ${styles.btnSuccess}`}
                onClick={() => {
                  closeDetailModal();
                  approveApplication(selectedAppData.id);
                }}
                disabled={processingId === selectedAppData.id}
              >
                {processingId === selectedAppData.id ? '⏳ Memproses...' : 'Setujui Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ Reject Modal */}
      {showRejectModal && (
        <div className="modalOverlay">
          <div className="modal">
            <div className="modalHeader">
              <h3>Tolak Request Akses Katalog</h3>
              <button
                className="modalClose"
                onClick={closeRejectModal}
              >
                ×
              </button>
            </div>
            <div className="modalBody">
              <p>Berikan alasan penolakan untuk user:</p>
              <p><strong>{applications.find(a => a.id === selectedAppId)?.nama}</strong></p>

              <textarea
                placeholder="Masukkan alasan penolakan..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  marginTop: '10px'
                }}
              />
            </div>
            <div className="modalFooter">
              <button
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={closeRejectModal}
              >
                Batal
              </button>
              <button
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={rejectApplication}
                disabled={!rejectionReason.trim()}
              >
                Tolak Request
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .modalOverlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }
        
        .modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }

        .detailModal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-width: 700px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 12px 12px 0 0;
        }

        .modalHeader h3 {
          margin: 0;
          color: #1f2937;
          font-size: 18px;
          font-weight: 600;
        }
        
        .modalClose {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .modalClose:hover {
          background: #e5e7eb;
          color: #374151;
        }
        
        .modalBody {
          padding: 24px;
        }

        .detailSection {
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .detailSection:last-child {
          border-bottom: none;
          margin-bottom: 0;
        }

        .detailSection h4 {
          margin: 0 0 16px 0;
          color: #1f2937;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
        }

        .detailSection h4:before {
          content: '';
          width: 4px;
          height: 16px;
          background: #3b82f6;
          margin-right: 8px;
          border-radius: 2px;
        }

        .userInfo {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .avatarLarge {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
          flex-shrink: 0;
          text-transform: uppercase;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .userDetails {
          flex: 1;
        }

        .detailRow {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          padding: 8px 0;
        }

        .detailRow:last-child {
          margin-bottom: 0;
        }

        .label {
          font-weight: 500;
          color: #6b7280;
          min-width: 140px;
          font-size: 14px;
        }

        .value {
          color: #1f2937;
          font-weight: 500;
          text-align: right;
          flex: 1;
          margin-left: 16px;
        }

        .ktpContainer {
          margin-top: 12px;
        }

        .ktpImageWrapper {
          position: relative;
          border-radius: 12px;
          overflow: hidden;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
        }

        .ktpImage {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
          display: block;
          border-radius: 10px;
        }

        .ktpError {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          color: #6b7280;
        }

        .errorIcon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .errorText {
          font-size: 14px;
        }

        .errorText small {
          display: block;
          margin-top: 8px;
          color: #9ca3af;
          word-break: break-all;
          font-size: 12px;
        }

        .ktpPlaceholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
          color: #6b7280;
          background: #f9fafb;
          border: 2px dashed #d1d5db;
          border-radius: 12px;
        }

        .placeholderIcon {
          font-size: 48px;
          margin-bottom: 12px;
        }

        .placeholderText {
          font-weight: 500;
        }

        .documentsList {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
        }

        .documentBadge {
          background: #f0f9ff;
          color: #0369a1;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid #e0f2fe;
        }
        
        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 20px 24px;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
          border-radius: 0 0 12px 12px;
        }
        
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }

        @media (max-width: 768px) {
          .detailModal {
            width: 98%;
            max-height: 95vh;
          }

          .userInfo {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .detailRow {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }

          .value {
            text-align: left;
            margin-left: 0;
          }

          .modalFooter {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </>
  );
}

export default Verifcard;