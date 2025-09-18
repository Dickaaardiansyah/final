import React from 'react';
import Sidebar from '../components/Profile/Sidebar';
import ProfileHeader from '../components/Profile/ProfileHeader';
import AccountInfo from '../components/Profile/AccountInfo';
import PersonalInfo from '../components/Profile/PersonalInfo';
import '../styles/Profile.css';

function Profile() {
  return (
    <div className="profile-container">
      <Sidebar />
      <div className="main-content">
        <ProfileHeader title="Profile" />
        <AccountInfo />
        <PersonalInfo />
      </div>
    </div>
  );
}

export default Profile;