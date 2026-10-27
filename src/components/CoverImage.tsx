import React, { useEffect, useState } from 'react';
import { resolveCoverUrl } from '../utils/covers';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  /** Shown when the book has no cover or the image fails to load. */
  fallback: React.ReactNode;
}

/** Book cover at its own proportions (never cropped); the caller sets the width or the box. */
export function CoverImage({ src, alt, className = '', fallback }: Props) {
  const url = resolveCoverUrl(src);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [url]);
  if (!url || failed) return <>{fallback}</>;
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
