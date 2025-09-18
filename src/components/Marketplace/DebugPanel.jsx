// src/components/Marketplace/DebugPanel.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

function DebugPanel({ 
  registrationPurpose, 
  catalogRegistrationComplete, 
  adminApprovalStatus, 
  registrationStep,
  onClearStatus,
  onSimulateApproval,
  onCheckDatabase
}) {
  const location = useLocation();
  
  const getExpectedView = () => {
    const path = location.pathname;
    
    if (registrationStep === 'upload-id') return '📄 Upload ID Page';
    if (registrationPurpose === 'catalog' && adminApprovalStatus === 'rejected') return '❌ Rejected Page';
    if (registrationPurpose === 'catalog' && catalogRegistrationComplete && adminApprovalStatus === 'pending') return '⏳ Pending Page';
    if (registrationPurpose === 'catalog' && catalogRegistrationComplete && adminApprovalStatus === 'approved' && path.includes('/katalog/daftar')) return '🎉 Success Redirect Page';
    if (path === '/marketplace' && adminApprovalStatus === 'approved') return '🛍️ Approved Marketplace';
    if (registrationPurpose === 'catalog' && !catalogRegistrationComplete) return '📝 Catalog Registration Prompt';
    if (registrationPurpose === 'marketplace') return '🛍️ Normal Marketplace';
    
    return '❓ Fallback Marketplace';
  };

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#1f2937',
      color: 'white',
      padding: '16px',
      borderRadius: '8px',
      fontSize: '12px',
      maxWidth: '300px',
      zIndex: 9999,
      fontFamily: 'monospace',
      boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#10b981' }}>🔧 Debug Panel</h4>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Path:</strong> {location.pathname}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Purpose:</strong> {registrationPurpose}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Completed:</strong> {catalogRegistrationComplete ? '✅' : '❌'}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Status:</strong> {adminApprovalStatus}
      </div>
      
      <div style={{ marginBottom: '8px' }}>
        <strong>Step:</strong> {registrationStep}
      </div>
      
      <div style={{ 
        marginBottom: '12px', 
        padding: '8px', 
        backgroundColor: '#374151', 
        borderRadius: '4px' 
      }}>
        <strong>Expected View:</strong><br />
        {getExpectedView()}
      </div>
      
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <button
          onClick={onClearStatus}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear
        </button>
        
        <button
          onClick={onSimulateApproval}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          ✅ Approve
        </button>
        
        <button
          onClick={onCheckDatabase}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          💾 Check DB
        </button>
        
        <button
          onClick={() => window.location.reload()}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          🔄 Reload
        </button>
      </div>
    </div>
  );
}

export default DebugPanel;