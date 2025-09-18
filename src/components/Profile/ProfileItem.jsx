import React, { useState } from 'react';
import { Edit2 } from 'lucide-react';

function ProfileItem({ id, icon, label, value, editable, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleEditClick = () => {
    if (!editable) return;
    setIsEditing(true);
  };

  const handleSave = () => {
    if (onEdit) {
      onEdit(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
    if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="profile-item">
      <div className="item-content">
        {icon && (
          <div className="item-icon">
            {icon}
          </div>
        )}
        <span className="item-label">{label}</span>
        {isEditing ? (
          <div className="edit-input-container">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleSave}
              autoFocus
              className="edit-input"
            />
          </div>
        ) : (
          <span className="item-value">{value}</span>
        )}
      </div>
      {editable && !isEditing && (
        <button className="edit-button" onClick={handleEditClick}>
          <Edit2 size={16} />
        </button>
      )}
    </div>
  );
}

export default ProfileItem;
