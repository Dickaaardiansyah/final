import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from '../data/userLogin';
import logo from '../assets/sea logo.png';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // New state for mobile menu
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null); // New ref for mobile menu

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

    checkLoginStatus();

    const handleLoginEvent = (e) => {
      if (e.detail?.user) {
        setIsLoggedIn(true);
        setUser(e.detail.user);
      } else {
        checkLoginStatus();
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
    setIsMobileMenuOpen(false); // Close mobile menu when clicking nav item
    
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
    setIsMobileMenuOpen(false); // Close mobile menu
    navigate('/login');
  };

  const handleRegisterClick = () => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false); // Close mobile menu
    navigate('/register');
  };

  const handleProfilePageClick = () => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false); // Close mobile menu
    navigate('/profil');
  };

  const handleLogoutClick = async () => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false); // Close mobile menu
    
    try {
      const result = await logoutUser();
      
      if (result.success) {
        setIsLoggedIn(false);
        setUser(null);
        window.dispatchEvent(new Event('userLoggedOut'));
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

  // New function to toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setShowDropdown(false); // Close dropdown when opening mobile menu
  };

  // Close dropdowns when clicking outside - Updated to include mobile menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        const hamburgerButton = document.querySelector('.hamburger-button');
        if (hamburgerButton && !hamburgerButton.contains(event.target)) {
          setIsMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus when route changes - Updated to include mobile menu
  useEffect(() => {
    setShowDropdown(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  if (loading) {
    return (
      <nav className="navbar">
        <div className="nav-container">
          <div className="logo" onClick={() => navigate('/')}>
            <img src={logo} alt="Fishmap AI" style={{ height: '40px', width: 'auto', marginRight: '8px' }} />
            <span>Fishmap AI</span>
          </div>
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
        {/* Logo */}
        <div className="logo" onClick={() => navigate('/')}>
          <img src={logo} alt="Fishmap AI" style={{ height: '40px', width: 'auto', cursor: 'pointer', marginRight: '8px' }} />
          <span>Fishmap AI</span>
        </div>

        {/* Desktop Navigation Menu */}
        <ul className="nav-menu desktop-only">
          {['home', 'galeri', 'cuaca', 'kontak'].map((id) => (
            <li key={id}>
              <a href={`#${id}`} onClick={(e) => handleNavClick(e, `#${id}`)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop Auth Section */}
        <div className="desktop-auth desktop-only">
          {!isLoggedIn ? (
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
              
              {/* Dropdown Menu */}
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

        {/* Mobile Hamburger Menu Button */}
        <button 
          className="hamburger-button mobile-only"
          onClick={toggleMobileMenu}
          style={{
            display: 'none',
            flexDirection: 'column',
            justifyContent: 'space-around',
            width: '30px',
            height: '30px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            zIndex: 1001
          }}
        >
          <div style={{
            width: '25px',
            height: '3px',
            backgroundColor: 'white',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: isMobileMenuOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'
          }}></div>
          <div style={{
            width: '25px',
            height: '3px',
            backgroundColor: 'white',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            opacity: isMobileMenuOpen ? 0 : 1
          }}></div>
          <div style={{
            width: '25px',
            height: '3px',
            backgroundColor: 'white',
            borderRadius: '2px',
            transition: 'all 0.3s ease',
            transform: isMobileMenuOpen ? 'rotate(-45deg) translate(8px, -8px)' : 'none'
          }}></div>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-menu"
          ref={mobileMenuRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            zIndex: 999,
            animation: 'slideDown 0.3s ease-out'
          }}
        >
          {/* Navigation Links */}
          <div style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {['home', 'galeri', 'cuaca', 'kontak'].map((id) => (
              <a 
                key={id}
                href={`#${id}`} 
                onClick={(e) => handleNavClick(e, `#${id}`)}
                style={{
                  display: 'block',
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  fontWeight: '500',
                  padding: '12px 2rem',
                  transition: 'all 0.3s ease',
                  borderLeft: '4px solid transparent'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.target.style.borderLeftColor = '#3b82f6';
                  e.target.style.color = '#3b82f6';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                  e.target.style.borderLeftColor = 'transparent';
                  e.target.style.color = '#e2e8f0';
                }}
              >
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
          </div>

          {/* Mobile Auth Section */}
          <div style={{ padding: '1rem 2rem 2rem 2rem' }}>
            {!isLoggedIn ? (
              <div>
                <button 
                  onClick={handleLoginClick}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    marginBottom: '8px',
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
                    width: '100%',
                    padding: '12px 16px',
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
              <div>
                {/* User Info */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: '#4a90e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {user?.email || 'user@example.com'}
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={handleProfilePageClick}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    👤 My Profile
                  </button>
                  
                  <button 
                    onClick={handleLogoutClick}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      color: '#ff6b6b',
                      border: '1px solid rgba(220, 53, 69, 0.3)',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                      transition: 'all 0.3s'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(220, 53, 69, 0.1)';
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Updated Styles */}
      <style jsx>{`
        /* Desktop-only elements */
        .desktop-only {
          display: flex;
        }
        
        /* Mobile-only elements */
        .mobile-only {
          display: none;
        }
        
        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .desktop-only {
            display: none !important;
          }
          
          .mobile-only {
            display: flex !important;
          }
          
          .hamburger-button {
            display: flex !important;
          }
          
          .nav-container {
            position: relative;
          }
          
          .logo {
            z-index: 1002;
          }
          
          .logo img {
            height: 30px;
          }
          
          .logo span {
            font-size: 20px;
          }
        }
        
        /* Keyframe animations */
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Hover effects for mobile menu items */
        .mobile-menu a:active {
          background-color: rgba(59, 130, 246, 0.2) !important;
          border-left-color: #3b82f6 !important;
          color: #3b82f6 !important;
        }
        
        /* Enhanced button styles */
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
          transition: transform 0.3s ease;
        }
        
        .logo:hover {
          transform: scale(1.05);
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
        
        /* Navigation menu styles */
        .nav-menu {
          display: flex;
          gap: 2rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        
        .nav-menu a {
          color: #e2e8f0;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s ease, transform 0.3s ease;
        }
        
        .nav-menu a:hover {
          color: #3b82f6;
          transform: translateY(-2px);
        }
        
        /* Mobile menu enhancements */
        .mobile-menu {
          max-height: 80vh;
          overflow-y: auto;
        }
        
        /* Smooth transitions for all interactive elements */
        * {
          -webkit-tap-highlight-color: transparent;
        }
        
        button, a {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        /* Additional mobile optimizations */
        @media (max-width: 480px) {
          .navbar {
            padding: 0.8rem 1rem;
          }
          
          .mobile-menu {
            left: -1rem;
            right: -1rem;
            border-radius: 0 0 0 0;
          }
          
          .logo span {
            font-size: 18px;
          }
        }
      `}</style>
    </nav>
  );
}

export default Navbar;