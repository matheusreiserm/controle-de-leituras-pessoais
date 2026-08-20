import React, { useState } from 'react';
import { getCountryCode, getCountryFlag } from '../utils/helpers';

interface CountryFlagProps {
  country: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  country,
  size = 'md',
  showName = false,
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);
  const code = getCountryCode(country);
  const emoji = getCountryFlag(country);

  // Custom sizes
  const sizeClasses = {
    xs: 'w-3.5 h-2.5',
    sm: 'w-4.5 h-3',
    md: 'w-5.5 h-4',
    lg: 'w-7 h-5',
    xl: 'w-9 h-6',
  }[size];

  // Switzerland flag is square 1:1, others are rectangular 3:2
  const isSquareFlag = code?.toLowerCase() === 'ch';
  const aspectClass = isSquareFlag ? 'aspect-square object-contain' : 'object-cover';

  const flagUrl = code ? `https://flagcdn.com/w40/${code.toLowerCase()}.png` : null;

  return (
    <span className={`inline-flex items-center gap-1.5 align-middle ${className}`}>
      {flagUrl && !imgError ? (
        <img
          src={flagUrl}
          alt={`Bandeira de ${country}`}
          className={`${sizeClasses} ${aspectClass} rounded-[2px] shadow-xs border border-stone-300/60 dark:border-stone-700/80 inline-block shrink-0 bg-stone-100 dark:bg-stone-800`}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      ) : (
        <span className="leading-none inline-block select-none text-base">{emoji}</span>
      )}
      {showName && <span>{country}</span>}
    </span>
  );
};
