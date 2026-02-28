import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className = "w-12 h-12" }) => {
  return (
    <div className={`relative ${className} group`}>
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full transition-transform duration-700 group-hover:scale-110"
      >
        {/* The "A" - Architectural Structure */}
        <path 
          d="M50 10L15 85H25L50 28L75 85H85L50 10Z" 
          fill="white" 
          className="transition-all duration-500 group-hover:fill-white/90"
        />
        
        {/* The "V" - Visionary Depth (Inverted/Negative Space) */}
        <path 
          d="M50 90L85 15H75L50 72L25 15H15L50 90Z" 
          fill="white" 
          fillOpacity="0.2"
          className="transition-all duration-500 group-hover:fill-opacity-40"
        />
        
        {/* Central Intersection - The "Core" */}
        <path 
          d="M50 35L38 65H62L50 35Z" 
          fill="white"
          className="animate-pulse"
        />
        
        {/* Subtle Grid Accents */}
        <line x1="10" y1="50" x2="90" y2="50" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="white" strokeOpacity="0.05" strokeWidth="0.5" />
      </svg>
    </div>
  );
};
