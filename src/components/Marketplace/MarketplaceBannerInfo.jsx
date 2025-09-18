// src/components/Marketplace/MarketplaceBannerInfo.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Info, ShoppingBag, Plus, CheckCircle } from 'lucide-react';

function MarketplaceBannerInfo({ registrationPurpose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const adminApprovalStatus = localStorage.getItem('adminApprovalStatus');

  if (registrationPurpose === 'catalog' && location.pathname.includes('/katalog/daftar')) {
    return (
      <div style={{
        backgroundColor: '#eff6ff',
        border: '1px solid #3b82f6',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Plus size={24} color="#3b82f6" />
        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: '#1e40af', 
            fontSize: '16px', 
            fontWeight: '600', 
            margin: '0 0 4px 0' 
          }}>
            📋 Mode: Daftar Kontributor Katalog
          </h3>
          <p style={{ 
            color: '#3730a3', 
            fontSize: '14px', 
            margin: '0 0 8px 0' 
          }}>
            Anda sedang mendaftar untuk menjadi kontributor katalog ikan.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              backgroundColor: 'transparent',
              color: '#3b82f6',
              border: '1px solid #3b82f6',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            🛍️ Lihat Marketplace Biasa
          </button>
        </div>
      </div>
    );
  }

  if (location.pathname === '/marketplace') {
    // Show different banner based on approval status
    if (adminApprovalStatus === 'approved') {
      return (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <CheckCircle size={24} color="#22c55e" />
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#15803d', 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 4px 0' 
            }}>
              ✅ Mode: Marketplace (Kontributor Katalog Disetujui)
            </h3>
            <p style={{ 
              color: '#166534', 
              fontSize: '14px', 
              margin: '0 0 8px 0' 
            }}>
              Anda dapat menjual produk dan berkontribusi ke katalog ikan.
            </p>
            <button
              onClick={() => navigate('/katalog/daftar')}
              style={{
                backgroundColor: 'transparent',
                color: '#22c55e',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📋 Lihat Status Katalog
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div style={{
          backgroundColor: '#f0fdf4',
          border: '1px solid #22c55e',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShoppingBag size={24} color="#22c55e" />
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#15803d', 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 4px 0' 
            }}>
              🛍️ Mode: Marketplace Normal
            </h3>
            <p style={{ 
              color: '#166534', 
              fontSize: '14px', 
              margin: '0 0 8px 0' 
            }}>
              Jual beli ikan dan aksesorium aquarium.
            </p>
            <button
              onClick={() => navigate('/katalog/daftar')}
              style={{
                backgroundColor: 'transparent',
                color: '#22c55e',
                border: '1px solid #22c55e',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              📋 Daftar Jadi Kontributor Katalog
            </button>
          </div>
        </div>
      );
    }
  }

  return null;
}

export default MarketplaceBannerInfo;
