
import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = "", 
  size = 100 
}) => {
  return (
    <img 
      src="https://697b7ddfc4feaabd2d103ec8.imgix.net/solomon%20buildning%20materials%20logo.png?w=512&h=512&fit=crop"
      alt="Solomon Building Materials Logo"
      width={size}
      height={size}
      className={`${className} h-auto object-contain rounded-2xl`}
      loading="lazy"
    />
  );
};

export default BrandLogo;
