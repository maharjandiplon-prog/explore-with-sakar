'use client';

/**
 * SafeImage — wraps next/image with a fallback for external URLs
 * that may not be in remotePatterns.
 *
 * For relative/local paths: uses next/image normally.
 * For external URLs: uses next/image with unoptimized=true, plus an
 *   onError handler that swaps to a plain <img> if it fails.
 */
import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

type SafeImageProps = ImageProps & {
  fallbackSrc?: string;
};

const FALLBACK = '/explore-with-sakar/images/mountains/sunrise-himalayas.jpg';

const ALLOWED_REMOTE_HOSTNAMES = [
  'explorewithsakar.com',
  'www.explorewithsakar.com',
  'storage.googleapis.com',
  'firebasestorage.googleapis.com',
  'images.unsplash.com',
];

function isSupportedRemote(srcStr: string): boolean {
  if (!srcStr.startsWith('http://') && !srcStr.startsWith('https://')) return true;
  try {
    const host = new URL(srcStr).hostname;
    return ALLOWED_REMOTE_HOSTNAMES.includes(host);
  } catch {
    return false;
  }
}

export default function SafeImage({ src, fallbackSrc = FALLBACK, alt, ...props }: SafeImageProps) {
  const [errored, setErrored] = useState(false);

  const srcStr = typeof src === 'string' ? src : '';
  const needsUnoptimized = Boolean(srcStr && !isSupportedRemote(srcStr));

  if (errored) {
    // Plain img fallback — always works, no hostname restriction
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={fallbackSrc}
        alt={alt as string}
        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        className={(props.className as string) || ''}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      {...props}
      unoptimized={props.unoptimized ?? needsUnoptimized}
      onError={() => setErrored(true)}
    />
  );
}

