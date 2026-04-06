
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = ""
}) => {
  return (

    <img 
      src="https://i.ibb.co/W4g8TfGn/Industrial-Aesthetic-Building-Materials-Logo-2.png"
      alt="Solomon Building Materials Logo"
      className={`${className} w-full h-full object-contain rounded-2xl`}
      loading="lazy"
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
    />

  );
};

export default BrandLogo;
