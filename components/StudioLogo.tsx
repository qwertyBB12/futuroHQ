import React, {useState} from 'react';

export default function StudioLogo() {
  const [failed, setFailed] = useState(false);

  if (failed) {
    // Fallback inline SVG so we never see the "FH" badge
    return (
      <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label="BeNeXT HQ">
        <rect x="0" y="0" width="28" height="28" rx="6" />
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#fff"
              fontFamily="system-ui, -apple-system, Segoe UI, Roboto">B</text>
      </svg>
    );
  }

  return (
    <img
      src="/favicon-32x32.png"   // file served from /static
      alt="BeNeXT HQ"
      style={{ height: 24, width: 'auto', display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}
