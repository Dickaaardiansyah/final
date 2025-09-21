import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../data/userLogin'; // Import API functions
import logo from '../assets/sea logo.png'; // Impor gambar logo

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Check login status saat component mount dan listen to events
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const result = await getCurrentUser();
        
        if (result.success) {
          setIsLoggedIn(true);
          setUser(result.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Check initial status
    checkLoginStatus();

    // Listen for custom login/logout events
    const handleLoginEvent = (e) => {
      if (e.detail?.user) {
        setIsLoggedIn(true);
        setUser(e.detail.user);
      } else {
        checkLoginStatus(); // Re-check from server
      }
    };

    const handleLogoutEvent = () => {
      setIsLoggedIn(false);
      setUser(null);
    };

    window.addEventListener('userLoggedIn', handleLoginEvent);
    window.addEventListener('userLoggedOut', handleLogoutEvent);

    return () => {
      window.removeEventListener('userLoggedIn', handleLoginEvent);
      window.removeEventListener('userLoggedOut', handleLogoutEvent);
    };
  }, []);

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    if (location.pathname === '/') {
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      navigate(`/#${targetId.replace('#', '')}`);
    }
  };

  const handleProfileClick = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleLoginClick = () => {
    setShowDropdown(false);
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setShowDropdown(false);
    navigate('/register');
  };

  const handleProfilePageClick = () => {
    setShowDropdown(false);
    navigate('/profil');
  };

  const handleLogoutClick = async () => {
    setShowDropdown(false);
    
    try {
      // Call logout API to clear server-side cookies
      const result = await logoutUser();
      
      if (result.success) {
        // Update state
        setIsLoggedIn(false);
        setUser(null);
        
        // Trigger custom event untuk components lain
        window.dispatchEvent(new Event('userLoggedOut'));
        
        // Navigate to home
        navigate('/');
        
        alert('Anda telah logout');
      } else {
        alert('Logout gagal, coba lagi');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Terjadi kesalahan saat logout');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown when route changes
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // Show loading state
  if (loading) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>
            <img src={logo} alt="Fishmap AI" style={{ height: '40px', width: 'auto', marginRight: '8px' }} />
            <span>Fishmap AI</span>
          </div>
          <ul className="nav-menu">
            {['home', 'galeri', 'cuaca', 'kontak'].map((id) => (
              <li key={id}>
                <a href={`#${id}`} onClick={(e) => handleNavClick(e, `#${id}`)}>
                  {id.charAt(0).toUpperCase() + id.slice(1)}
                </a>
              </li>
            ))}
          </ul>
          
          <div style={{ color: 'white', fontSize: '14px' }}>
            Loading...
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logo} alt="Fishmap AI" style={{ height: '40px', width: 'auto', marginRight: '8px', cursor: 'pointer' }} />
          <span>Fishmap AI</span>
        </div>
        <ul className="nav-menu">
          {['home', 'galeri', 'cuaca', 'kontak'].map((id) => (
            <li key={id}>
              <a href={`#${id}`} onClick={(e) => handleNavClick(e, `#${id}`)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            </li>
          ))}
        </ul>
        
        {/* Conditional Rendering berdasarkan login status */}
        {!isLoggedIn ? (
          // Not logged in - show Login/Register buttons
          <div className="auth-buttons">
            <button 
              onClick={handleLoginClick}
              style={{
                padding: '8px 16px',
                marginRight: '8px',
                backgroundColor: 'transparent',
                color: 'white',
                border: '1px solid white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#333';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
              }}
            >
              Login
            </button>
            <button 
              onClick={handleRegisterClick}
              style={{
                padding: '8px 16px',
                backgroundColor: 'white',
                color: '#333',
                border: '1px solid white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f0f0f0';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'white';
              }}
            >
              Register
            </button>
          </div>
        ) : (
          // Logged in - show Profile dropdown
          <div className="profile-dropdown" ref={dropdownRef}>
            <div 
              className="user-profile" 
              onClick={handleProfileClick}
              style={{ 
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background-color 0.3s',
                backgroundColor: showDropdown ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#4a90e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: 'bold'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span style={{ color: 'white', fontSize: '14px' }}>
                {user?.name || 'User'}
              </span>
              <span style={{ 
                color: 'white', 
                fontSize: '12px', 
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}>
                ▼
              </span>
            </div>
            
            {/* Dropdown Menu untuk User yang sudah login */}
            {showDropdown && (
              <div 
                className="dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: '0',
                  backgroundColor: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  minWidth: '200px',
                  zIndex: 1000,
                  marginTop: '8px',
                  overflow: 'hidden'
                }}
              >
                {/* User Info */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ color: '#666', fontSize: '12px' }}>
                    {user?.email || 'user@example.com'}
                  </div>
                </div>

                {/* Menu Items */}
                <div 
                  onClick={handleProfilePageClick}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#333',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>👤</span>
                  My Profile
                </div>
                
                <div 
                  onClick={handleLogoutClick}
                  style={{
                    padding: '12px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#dc3545',
                    fontSize: '14px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#fff5f5'}
                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <span style={{ fontSize: '16px' }}>🚪</span>
                  Logout
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <style jsx>{`
        .auth-buttons {
          display: flex;
          align-items: center;
        }
        
        .profile-dropdown {
          position: relative;
        }
        
        .dropdown-menu {
          animation: dropdownFadeIn 0.2s ease-out;
        }
        
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .dropdown-menu div:hover {
          background-color: #f8f9fa !important;
        }
        
        .logo {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .logo img {
          height: 40px;
          width: auto;
          object-fit: contain;
          margin-right: 8px;
        }
        
        .logo span {
          font-size: 24px;
          font-weight: bold;
          color: white;
        }
      
        
        @media (max-width: 768px) {
          .auth-buttons {
            gap: 8px;
          }
          
          .auth-buttons button {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
          
          .dropdown-menu {
            right: -10px;
            min-width: 180px;
          }
          
          .user-profile span {
            display: none;
          }
          
          .logo img {
            height: 30px;
          }
          
          .logo span {
            font-size: 20px;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;