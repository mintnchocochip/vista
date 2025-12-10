// src/shared/components/Card.jsx - VIT Theme
import React from 'react';

const Card = ({ children, className = '', padding = 'md' }) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-6'
  };
  
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${paddings[padding]} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
