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
    <header className="bg-white shadow-lg border-b border-neutral-200 relative z-30">
      <div className="flex justify-between items-center px-6 py-4">
        <div className="flex items-center space-x-4 z-10">
          <button
            type="button"
            onClick={toggleSidebar}
            className="menu-button p-2 text-neutral-600 hover:text-primary hover:bg-neutral-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:ring-opacity-50 transition-all duration-200"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            {/* Truck Icon */}
            <div className="p-2 bg-accent-50 rounded-lg">
              <svg className="h-6 w-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
              </svg>
            </div>
            <div className="flex flex-col">
              <p className="text-sm text-neutral-600 font-medium">Management System</p>
            </div>
          </div>
        </div>
        
        {/* Road Freight Logo - Center */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <div className="block hover:opacity-80 transition-opacity">
            <img 
              src="/images/road-freight-logo.svg" 
              alt="Road Freight" 
              className="h-14 w-auto object-contain max-w-xs" 
              onError={(e) => {
                // If SVG fails, try to load PNG fallback
                e.target.onerror = null; 
                e.target.src = "/images/road-freight-logo.png";
                // If PNG fails too, use a truck icon from Heroicons as final fallback
                e.target.onerror = () => {
                  const parent = e.target.parentNode;
                  e.target.remove();
                  // Create SVG truck icon directly in the DOM
                  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
                  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                  svg.setAttribute("className", "h-14 w-auto");
                  svg.setAttribute("fill", "none");
                  svg.setAttribute("viewBox", "0 0 24 24");
                  svg.setAttribute("stroke", "#1d4ed8");
                  svg.setAttribute("strokeWidth", "1.5");
                  
                  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                  path.setAttribute("strokeLinecap", "round");
                  path.setAttribute("strokeLinejoin", "round");
                  path.setAttribute("d", "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0");
                  
                  svg.appendChild(path);
                  parent.appendChild(svg);
                };
              }}
            />
          </div>
        </div>

        <div className="flex items-center space-x-4 z-10">
          <div className="mr-4 flex flex-col items-end">
            <h3 className="text-sm font-medium text-neutral-700">{user?.displayName || user?.email}</h3>
          </div>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary shadow-md transition-all duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header; 