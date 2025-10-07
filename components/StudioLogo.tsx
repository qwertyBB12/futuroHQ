import React from 'react';

export default function StudioLogo() {
  // temporary inline SVG so we can SEE the override is active
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" role="img" aria-label="BeNeXT HQ">
      <rect x="0" y="0" width="28" height="28" rx="6" />
      <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle" fontSize="14" fill="#fff" fontFamily="system-ui, -apple-system, Segoe UI, Roboto">
        B
      </text>
    </svg>
  );
}
