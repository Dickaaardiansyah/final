import React, { useState, useEffect, useMemo } from 'react';
import styles from "../../styles/admin/Dashboard.module.css";
import Sidebar from '../admin/Sidebar';
import Header from '../admin/Header';
import { useAdminAuth } from './auth/AdminAuthContext'; // Import admin auth context

function Anggota() {
  const [anggotaData, setAnggotaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('nama');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // ✅ PERBAIKAN: Gunakan admin auth context
  const { isAuthenticated, getAuthHeader } = useAdminAuth();

  // Fetch approved users from backend
  useEffect(() => {
    const fetchApprovedUsers = async () => {
      try {
        setLoading(true);
        
        // ✅ PERBAIKAN: Cek authentication status
        if (!isAuthenticated) {
          console.warn('Admin tidak terautentikasi');
          setError('Admin tidak terautentikasi. Silakan login ulang.');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching approved users with admin auth...');
        
        // ✅ PERBAIKAN: Gunakan getAuthHeader() untuk mendapatkan token yang valid
        const headers = await getAuthHeader();
        
        const response = await fetch('http://localhost:5000/api/admin/approved-users', {
          method: 'GET',
          headers: headers // Menggunakan headers dari context yang sudah include token
        });

        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Non-JSON response received:', text.substring(0, 200));
          throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.msg || 'Gagal mengambil data anggota');
        }

        // Transform data to match expected format
        const transformedData = data.users?.map(user => ({
          id: user.id,
          nama: user.name,
          email: user.email,
          telepon: user.phone,
          alamat: user.alamat || '-',
          status: user.catalog_request_status === 'approved' ? 'Aktif' : 'Tidak Aktif',
          tanggalDaftar: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : '',
          tanggalApproved: user.catalog_approved_date ? new Date(user.catalog_approved_date).toISOString().split('T')[0] : '',
          jenisUsaha: user.jenis_usaha || 'Penjual Ikan',
          role: user.role,
          isVerified: user.is_verified
        })) || [];

        setAnggotaData(transformedData);
        setError(null);
        console.log('✅ Successfully loaded', transformedData.length, 'approved users');
        
      } catch (err) {
        console.error('❌ Error fetching approved users:', err);
        setError(err.message);
        
        // ✅ PERBAIKAN: Hanya fallback ke sample data dalam development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Development mode: using sample data as fallback');
          setAnggotaData([
            {
              id: 1,
              nama: "Sample User 1",
              email: "sample1@email.com",
              telepon: "08123456789",
              alamat: "Alamat Sample 1",
              status: "Aktif",
              tanggalDaftar: "2024-01-15",
              tanggalApproved: "2024-01-20",
              jenisUsaha: "Penjual Ikan Laut",
              role: "contributor",
              isVerified: true
            }
          ]);
        }
      } finally {
        setLoading(false);
      }
    };

    // ✅ PERBAIKAN: Hanya fetch jika sudah authenticated
    if (isAuthenticated) {
      fetchApprovedUsers();
    } else {
      setLoading(false);
      setError('Menunggu autentikasi admin...');
    }
  }, [isAuthenticated, getAuthHeader]); // ✅ Dependency pada authentication status

  // Filter dan search data
  const filteredData = useMemo(() => {
    let filtered = anggotaData;

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter(anggota =>
        anggota.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anggota.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        anggota.telepon.includes(searchTerm) ||
        (anggota.jenisUsaha && anggota.jenisUsaha.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter berdasarkan status
    if (statusFilter !== 'Semua') {
      filtered = filtered.filter(anggota => anggota.status === statusFilter);
    }

    // Sort data
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'tanggalDaftar' || sortBy === 'tanggalApproved') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [anggotaData, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = ['ID', 'Nama', 'Email', 'Telepon', 'Alamat', 'Status', 'Tanggal Daftar', 'Tanggal Approved', 'Jenis Usaha', 'Role'];
    const csvContent = [
      headers.join(','),
      ...filteredData.map(anggota => [
        anggota.id,
        `"${anggota.nama}"`,
        anggota.email,
        anggota.telepon,
        `"${anggota.alamat}"`,
        anggota.status,
        anggota.tanggalDaftar,
        anggota.tanggalApproved,
        `"${anggota.jenisUsaha}"`,
        anggota.role
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `anggota_approved_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ✅ PERBAIKAN: Tampilkan pesan yang lebih jelas saat tidak authenticated
  if (!isAuthenticated) {
    return (
      <div className="containerAdmin">
        <Sidebar />
        <main className={styles.mainContent}>
          <Header />
          <div className={styles.verificationSection}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <svg style={{ width: '48px', height: '48px', color: '#f59e0b' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
              </svg>
              <p style={{ color: '#f59e0b', textAlign: 'center' }}>
                Session admin tidak valid. Silakan login ulang.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="containerAdmin">
        <Sidebar />
        <main className={styles.mainContent}>
          <Header />
          <div className={styles.verificationSection}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #e2e8f0',
                borderTop: '4px solid #0891b2',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ color: '#64748b' }}>Memuat data anggota...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="containerAdmin">
        <Sidebar />
        <main className={styles.mainContent}>
          <Header />
          <div className={styles.verificationSection}>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '400px',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <svg style={{ width: '48px', height: '48px', color: '#dc2626' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
              </svg>
              <p style={{ color: '#dc2626', textAlign: 'center' }}>
                Error: {error}
              </p>
              <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="containerAdmin">
      <Sidebar />
      <main className={styles.mainContent}>
        <Header />
        <div className={styles.verificationSection}>
          {/* Header Section */}
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2 .89 2-2 2-2-.89-2-2zM4 18v-4h3v4h2v-4h2l1.13-4.5c.33-.67.85-1.2 1.48-1.53L15.5 7H13V5h4l1.5 2.84c.15.28.15.62 0 .89L16.97 12H18v4c0 1.11-.89 2-2 2s-2-.89-2-2v-2h-2v4H4z"/>
                <path d="M12.5 11.5c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5S11 9.17 11 10s.67 1.5 1.5 1.5z"/>
                <path d="M5.5 6C6.33 6 7 5.33 7 4.5S6.33 3 5.5 3 4 3.67 4 4.5 4.67 6 5.5 6z"/>
              </svg>
              Anggota Terverifikasi ({filteredData.length})
            </h2>
            <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
              Daftar user yang telah disetujui akses katalognya
            </p>
          </div>

          {/* Search and Filter Section */}
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            marginBottom: '2rem', 
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {/* Search Input */}
            <div style={{ flex: '1', minWidth: '300px' }}>
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, telepon, atau jenis usaha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  transition: 'border-color 0.3s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0891b2'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.9rem',
                outline: 'none',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
            </select>

            {/* Export Button */}
            <button 
              className={styles.btn + ' ' + styles.btnOutline}
              onClick={handleExportData}
            >
              <svg style={{ width: '16px', height: '16px', marginRight: '0.5rem' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              Export Data
            </button>
          </div>

          {/* Statistics Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#0891b2' }}>
                {anggotaData.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Total Anggota Approved
              </div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
                {anggotaData.filter(a => a.status === 'Aktif').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Anggota Aktif
              </div>
            </div>
            <div style={{
              padding: '1.5rem',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              <div style={{ fontSize: '2rem', fontWeight: '700', color: '#7c3aed' }}>
                {anggotaData.filter(a => a.role === 'contributor').length}
              </div>
              <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                Contributor
              </div>
            </div>
          </div>

          {/* Table */}
          <div style={{ 
            overflowX: 'auto',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <tr>
                  <th 
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('nama')}
                  >
                    Nama {sortBy === 'nama' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                    Kontak
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#1e293b' }}>
                    Role & Status
                  </th>
                  <th 
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('tanggalDaftar')}
                  >
                    Tanggal Daftar {sortBy === 'tanggalDaftar' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    style={{ 
                      padding: '1rem', 
                      textAlign: 'left', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      cursor: 'pointer',
                      userSelect: 'none'
                    }}
                    onClick={() => handleSort('tanggalApproved')}
                  >
                    Tanggal Approved {sortBy === 'tanggalApproved' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                    Verifikasi Email
                  </th>
                  <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#1e293b' }}>
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length > 0 ? (
                  filteredData.map((anggota, index) => (
                    <tr 
                      key={anggota.id}
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb'
                      }}
                    >
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '0.25rem' }}>
                            {anggota.nama}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            ID: #{anggota.id.toString().padStart(3, '0')}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div>
                          <div style={{ marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                            {anggota.email}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            {anggota.telepon}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            backgroundColor: anggota.role === 'contributor' ? '#f3e8ff' : '#e0f2fe',
                            color: anggota.role === 'contributor' ? '#7c3aed' : '#0891b2',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            textAlign: 'center'
                          }}>
                            {anggota.role === 'contributor' ? 'Contributor' : 'User'}
                          </span>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            backgroundColor: anggota.status === 'Aktif' ? '#dcfce7' : '#fee2e2',
                            color: anggota.status === 'Aktif' ? '#059669' : '#dc2626',
                            textAlign: 'center'
                          }}>
                            {anggota.status}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                        {anggota.tanggalDaftar ? new Date(anggota.tanggalDaftar).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#475569' }}>
                        {anggota.tanggalApproved ? new Date(anggota.tanggalApproved).toLocaleDateString('id-ID') : '-'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          backgroundColor: anggota.isVerified ? '#dcfce7' : '#fee2e2',
                          color: anggota.isVerified ? '#059669' : '#dc2626'
                        }}>
                          {anggota.isVerified ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                          <button 
                            style={{
                              padding: '0.4rem',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = '#0891b2';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = '#f1f5f9';
                              e.target.style.color = '#64748b';
                            }}
                            title="Lihat Detail"
                            onClick={() => {
                              console.log('View detail for user:', anggota.id);
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                            </svg>
                          </button>
                          <button 
                            style={{
                              padding: '0.4rem',
                              border: 'none',
                              borderRadius: '6px',
                              backgroundColor: '#f1f5f9',
                              color: '#64748b',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease'
                            }}
                            onMouseOver={(e) => {
                              e.target.style.backgroundColor = '#dc2626';
                              e.target.style.color = '#ffffff';
                            }}
                            onMouseOut={(e) => {
                              e.target.style.backgroundColor = '#f1f5f9';
                              e.target.style.color = '#64748b';
                            }}
                            title="Revoke Access"
                            onClick={() => {
                              if (confirm(`Yakin ingin mencabut akses katalog untuk ${anggota.nama}?`)) {
                                console.log('Revoke access for user:', anggota.id);
                              }
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ 
                      padding: '3rem', 
                      textAlign: 'center', 
                      color: '#64748b',
                      fontSize: '1.1rem'
                    }}>
                      <div>
                        <svg style={{ width: '48px', height: '48px', marginBottom: '1rem', opacity: '0.5' }} viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
                        </svg>
                        <div>Tidak ada anggota ditemukan</div>
                        {searchTerm && (
                          <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            Coba ubah kata kunci pencarian
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {filteredData.length > 0 && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#64748b'
            }}>
              Menampilkan {filteredData.length} dari {anggotaData.length} anggota approved
              {searchTerm && ` untuk "${searchTerm}"`}
              {statusFilter !== 'Semua' && ` dengan status ${statusFilter}`}
            </div>
          )}
        </div>
      </main>

      {/* Add CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Anggota;