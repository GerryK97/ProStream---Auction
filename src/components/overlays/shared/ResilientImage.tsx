'use client';

import React, { useEffect, useMemo, useState } from 'react';

type ResilientImageProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError' | 'src'> & {
  src: string | null | undefined;
  maxRetries?: number;
  retryDelayMs?: number;
  fallback?: React.ReactNode;
};

function withRetryParam(src: string, attempt: number) {
  if (attempt <= 0 || src.startsWith('data:') || src.startsWith('blob:')) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}_overlayRetry=${attempt}`;
}

/**
 * Overlay browsers/OBS can occasionally keep a failed image decode in-memory
 * until a hard refresh. This component retries failed loads with a tiny cache
 * bust param and shows the provided fallback only after retries are exhausted.
 */
export default function ResilientImage({
  src,
  alt = '',
  maxRetries = 2,
  retryDelayMs = 350,
  fallback = null,
  loading = 'eager',
  decoding = 'async',
  ...imgProps
}: ResilientImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);
  const resolvedSrc = useMemo(() => (src ? withRetryParam(src, attempt) : ''), [src, attempt]);

  useEffect(() => {
    setAttempt(0);
    setFailed(false);
  }, [src]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <img
      {...imgProps}
      src={resolvedSrc}
      alt={alt}
      loading={loading}
      decoding={decoding}
      onError={() => {
        if (attempt < maxRetries) {
          window.setTimeout(() => setAttempt((value) => value + 1), retryDelayMs);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
