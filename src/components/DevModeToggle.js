// Dev Mode Toggle Component for Dashboard
// This component provides a global toggle for section badges across the entire application

import React from 'react';
import { Settings, Eye, EyeOff } from 'lucide-react';

export const DevModeToggle = ({ className = '' }) => {
  const [isDevMode, setIsDevMode] = React.useState(() => {
    // Check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('goldsmith-dev-mode');
      return saved === 'true';
    }
    return false;
  });

  const toggleDevMode = () => {
    const newMode = !isDevMode;
    setIsDevMode(newMode);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('goldsmith-dev-mode', newMode.toString());
    }

    // Reload page to apply changes (since SHOW_SECTION_BADGES is a constant)
    window.location.reload();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={toggleDevMode}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
          isDevMode
            ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {isDevMode ? (
          <>
            <EyeOff className="w-4 h-4" />
            <span className="hidden sm:inline">Hide Section Badges</span>
            <span className="sm:hidden">DEV</span>
          </>
        ) : (
          <>
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Show Section Badges</span>
            <span className="sm:hidden">PROD</span>
          </>
        )}
      </button>

      {isDevMode && (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          DEV MODE
        </span>
      )}
    </div>
  );
};

// Hook to get current dev mode status
export const useGlobalDevMode = () => {
  const [isDevMode, setIsDevMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('goldsmith-dev-mode');
      setIsDevMode(saved === 'true');
    }
  }, []);

  return isDevMode;
};