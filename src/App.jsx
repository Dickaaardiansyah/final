import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppRoutes } from './routes/AppRoutes';
import './styles/main.css';

function App() {
  
  return (
    <div className="app">
      <AppRoutes />
    </div>
  );
}

export default App;