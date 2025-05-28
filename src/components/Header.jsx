import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOutUser } from '../firebase/authUtils';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSignOut = async () => {
    const result = await signOutUser();
    if (result.success) {
      navigate('/login');
    }
  };

  return (
    <header className="bg-white shadow-md relative z-30">
      <div className="flex justify-between items-center px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleSidebar}
            className="menu-button text-gray-600 hover:text-blue-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            {/* Truck Icon */}
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-gray-900">Transcon</h1>
              <p className="text-sm text-gray-600">Management System</p>
            </div>
          </div>
        </div>
        
        {/* Expeditors Logo - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <a 
            href="https://www.expeditors.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block hover:opacity-80 transition-opacity"
          >
            <img 
              src="/expeditors.png" 
              alt="Expeditors" 
              className="h-10 object-contain"
            />
          </a>
        </div>

        <div className="flex items-center space-x-4">
          <div className="mr-4 flex flex-col items-end">
            <h3 className="text-sm font-medium text-gray-700">{user?.displayName || user?.email}</h3>
            <p className="text-xs text-gray-500">Private</p>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 