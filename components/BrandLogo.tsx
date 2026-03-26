
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "", 
  size = 200
}) => {
  return (

    <img 
      src="https://i.ibb.co/W4g8TfGn/Industrial-Aesthetic-Building-Materials-Logo-2.png"
      alt="Solomon Building Materials Logo"
      width={size}
      height={size}
      className={`${className} h-auto object-contain rounded-2xl`}
      style={{ maxWidth: size }}
      loading="lazy"
      referrerPolicy="no-referrer"
    />

  );
};

export default BrandLogo;
