// Section Badge Component for Dev Mode Context
// This component provides numbered section badges for easier AI context
// Toggle visibility using the SHOW_SECTION_BADGES constant or devMode prop

import React from 'react';

export const SHOW_SECTION_BADGES = false; // Global toggle - set to true to show badges everywhere

export const SectionBadge = ({
  id,
  label,
  devMode,
  color = 'gray',
  className = ''
}) => {
  // Check localStorage for global dev mode setting
  const [globalDevMode, setGlobalDevMode] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('goldsmith-dev-mode');
      setGlobalDevMode(saved === 'true');
    }
  }, []);

  // Show badges if devMode is true OR if global SHOW_SECTION_BADGES is true OR if localStorage has dev mode enabled
  const shouldShow = devMode === true || SHOW_SECTION_BADGES || globalDevMode;

  if (!shouldShow) {
    return null;
  }

  const colorClasses = {
    gray: 'bg-gray-100 text-gray-700 border-gray-300',
    purple: 'bg-purple-100 text-purple-700 border-purple-300',
    blue: 'bg-blue-100 text-blue-700 border-blue-300',
    orange: 'bg-orange-100 text-orange-700 border-orange-300',
    green: 'bg-green-100 text-green-700 border-green-300',
    red: 'bg-red-100 text-red-700 border-red-300',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-xs font-semibold shadow-sm ${colorClasses[color]} ${className}`}>
      <span className="font-bold">#{id}</span>
      <span className="text-xs opacity-75">{label}</span>
    </div>
  );
};

// Hook for managing dev mode state across components
export const useDevMode = () => {
  const [devMode, setDevMode] = React.useState(SHOW_SECTION_BADGES);

  const toggleDevMode = React.useCallback(() => {
    setDevMode(prev => !prev);
  }, []);

  return { devMode, setDevMode, toggleDevMode };
};