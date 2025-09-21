import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, History, ShoppingBag } from 'lucide-react';

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState(getActiveItemFromPath(location.pathname));

  function getActiveItemFromPath(pathname) {
    if (pathname.includes('profile') || pathname.includes('profil')) return 'profile';
    if (pathname.includes('history')) return 'history';
    return 'profile';
  }

  const navItems = [
    {
      id: 'profile',
      icon: <User size={20} />,
      label: 'Profile',
      path: '/profil'
    },
    {
      id: 'history',
      icon: <History size={20} />,
      label: 'History',
      path: '/history'
    },
  ];

  const handleItemClick = (id, path) => {
    setActiveItem(id);
    navigate(path);
  };

  // Update active item when route changes
  React.useEffect(() => {
    setActiveItem(getActiveItemFromPath(location.pathname));
  }, [location.pathname]);

  return (
    <div className="sidebar">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-item ${activeItem === item.id ? 'active' : ''}`}
          onClick={() => handleItemClick(item.id, item.path)}
        >
          <div className="nav-icon">
            {item.icon}
          </div>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export default Sidebar;