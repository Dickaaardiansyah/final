import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from './auth/AdminAuthContext';
import styles from "../../styles/admin/Dashboard.module.css";
import '../../styles/admin/dashboard.css';
import '../../styles/admin/AdminHeader.css'; // Import CSS header yang baru

function Header() {
    const navigate = useNavigate();
    const { adminInfo, logout, isAuthenticated } = useAdminAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    // Debug log untuk melihat adminInfo
    useEffect(() => {
        console.log('Header - Admin Info:', adminInfo);
        console.log('Header - Is Authenticated:', isAuthenticated);
    }, [adminInfo, isAuthenticated]);

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/admin/login');
        }
    };

    const getInitials = (name) => {
        if (!name) return 'AD';
        return name.split(' ').map(n => n[0]).join('').toUpperCase();
    };

    const getRoleDisplayName = (role) => {
        switch(role) {
            case 'super_admin':
                return 'Super Admin';
            case 'seller_verifier':
                return 'Verifikator Penjual';
            case 'admin':
                return 'Admin';
            default:
                return 'Admin';
        }
    };

    const getRoleClassName = (role) => {
        switch(role) {
            case 'super_admin':
                return 'roleSuper';
            case 'seller_verifier':
                return 'roleVerifier';
            case 'admin':
                return 'roleAdmin';
            default:
                return 'roleDefault';
        }
    };

    const handleProfileClick = () => {
        setShowDropdown(false);
        console.log('Go to profile');
        // Navigate to profile page when implemented
    };

    const handleSettingsClick = () => {
        setShowDropdown(false);
        console.log('Go to settings');
        // Navigate to settings page when implemented
    };

    return (
        <header className={styles.header}>
            <div className={styles.headerLeft}>
                <h1>Dashboard Verifikasi</h1>
                <p>Kelola pendaftaran penjual ikan baru di platform FishMap</p>
            </div>
            
            <div className={styles.headerActions}>
                <button className={`${styles.btn} ${styles.btnOutline}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
                    </svg>
                    Filter
                </button>
                
                {/* Admin Info Section */}
                <div className={`${styles.userInfo} headerUserInfo`}>
                    <div className="userInfoText">
                        <span className="userName">
                            {adminInfo?.name || 'Loading...'}
                        </span>
                        {adminInfo?.role && (
                            <span className={`userRole ${getRoleClassName(adminInfo.role)}`}>
                                {getRoleDisplayName(adminInfo.role)}
                            </span>
                        )}
                    </div>
                    
                    <div 
                        className={`${styles.avatar} headerAvatar`}
                        onClick={() => setShowDropdown(!showDropdown)}
                    >
                        {getInitials(adminInfo?.name)}
                    </div>

                    {/* Dropdown Menu */}
                    {showDropdown && (
                        <div className="userDropdown">
                            {/* Profile Info */}
                            <div className="dropdownProfile">
                                <div className="dropdownName">
                                    {adminInfo?.name || 'Admin'}
                                </div>
                                <div className="dropdownEmail">
                                    {adminInfo?.email || 'admin@fishmap.com'}
                                </div>
                                {adminInfo?.role && (
                                    <div className={`dropdownRole ${getRoleClassName(adminInfo.role)}`}>
                                        {getRoleDisplayName(adminInfo.role)}
                                    </div>
                                )}
                            </div>

                            {/* Menu Items */}
                            <div className="dropdownMenu">
                                <button
                                    className="dropdownItem"
                                    onClick={handleProfileClick}
                                >
                                    <svg className="dropdownIcon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                    Profil Admin
                                </button>

                                <button
                                    className="dropdownItem"
                                    onClick={handleSettingsClick}
                                >
                                    <svg className="dropdownIcon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.82,11.69,4.82,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                                    </svg>
                                    Pengaturan
                                </button>

                                <div className="dropdownDivider" />

                                <button
                                    className="dropdownItem logout"
                                    onClick={handleLogout}
                                >
                                    <svg className="dropdownIcon" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div 
                    className="dropdownOverlay"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </header>
    );
}

export default Header;