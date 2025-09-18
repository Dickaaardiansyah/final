import React, { useState } from 'react';
import Sidebar from '../components/History/Sidebar';
import HistoryHeader from '../components/History/HistoryHeader';
import HistoryContent from '../components/History/HistoryContent';
import '../styles/History.css';

function History() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="history-container">
      <Sidebar />
      <div className="main-content">
        <HistoryHeader 
          title="History" 
          onSearchChange={handleSearchChange}
          searchQuery={searchQuery}
        />
        <HistoryContent searchQuery={searchQuery} />
      </div>
    </div>
  );
}

export default History;