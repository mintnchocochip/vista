// src/shared/components/UserMenu.jsx
import React, { useState, useRef, useEffect } from 'react';
import { UserCircleIcon, KeyIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const UserMenu = ({ user, onChangePassword }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors"
      >
        <UserCircleIcon className="w-6 h-6 text-blue-600" />
        <div className="text-right">
          <p className="font-semibold text-sm text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => {
              setIsOpen(false);
              onChangePassword();
            }}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
          >
            <KeyIcon className="w-4 h-4 text-gray-500" />
            Change Password
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
