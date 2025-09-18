import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function ProfileHeader({ title }) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="header">
      <button className="back-button" onClick={handleBackClick}>
        <ArrowLeft size={24} />
      </button>
      <h1 className="page-title">{title}</h1>
    </div>
  );
}

export default ProfileHeader;