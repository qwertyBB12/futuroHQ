// components/StudioLogo.tsx
import React from 'react';

export default function StudioLogo() {
  // Prefer a crisp PNG; 24px tall looks good in the Studio header
  return (
    <img
      src="/favicon-32x32.png"   // or "/apple-touch-icon.png" or "/favicon.ico"
      alt="BeNeXT HQ"
      style={{ height: 24, width: 'auto' }}
    />
  );
}
