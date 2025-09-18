// src/pages/Marketplace.jsx - Update dengan minimal changes
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom'; // ⭐ TAMBAH ini
import Sidebar from '../components/Marketplace/Sidebar';
import MarketplaceHeader from '../components/Marketplace/MarketplaceHeader';
import MarketplaceContent from '../components/Marketplace/MarketplaceContent';
import '../styles/Marketplace.css';
import '../styles/UploadIDPage.css';

function Marketplace({ catalogRegistrationMode = false }) { // ⭐ TAMBAH prop ini
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const location = useLocation(); // ⭐ TAMBAH ini

  // ⭐ TAMBAH: Check if this is catalog registration mode
  const isCatalogMode = catalogRegistrationMode || location.state?.action === 'catalog-registration';

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="marketplace-container">
      <Sidebar />
      <div className="main-content">
        <MarketplaceHeader 
          title={isCatalogMode ? "Daftar Akses Katalog" : "Marketplace"} // ⭐ UPDATE ini
          onSearchChange={handleSearchChange}
          searchQuery={searchQuery}
        />
        <MarketplaceContent 
          searchQuery={searchQuery} 
          isRegistered={isRegistered}
          setIsRegistered={setIsRegistered}
          catalogRegistrationMode={isCatalogMode} // ⭐ TAMBAH prop ini
        />
      </div>
    </div>
  );
}

export default Marketplace;