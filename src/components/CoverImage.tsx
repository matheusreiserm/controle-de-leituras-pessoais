import React, { useEffect, useState } from 'react';
import { resolveCoverUrl } from '../utils/covers';

interface Props {
  src?: string;
  /** Tried when src fails, before the gradient (the embedded copy kept with Drive covers). */
  fallbackSrc?: string;
  alt: string;
  className?: string;
  /** Shown when the book has no cover or the image fails to load. */
  fallback: React.ReactNode;
}

/** Book cover at its own proportions (never cropped); the caller sets the width or the box. */
export function CoverImage({ src, fallbackSrc, alt, className = '', fallback }: Props) {
  const sources = [resolveCoverUrl(src), resolveCoverUrl(fallbackSrc)].filter(Boolean);
  const [failures, setFailures] = useState(0);
  useEffect(() => setFailures(0), [src, fallbackSrc]);
  const url = sources[failures];
  if (!url) return <>{fallback}</>;
  return (
    <img
      key={url}
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailures((count) => count + 1)}
      className={className}
    />
  );
}
