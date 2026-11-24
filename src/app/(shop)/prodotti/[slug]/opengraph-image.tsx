import { ImageResponse } from 'next/og';

/**
 * GLORYBELLE — Open Graph image generator
 * P1 fix #23 — per-product social preview image (1200×630).
 * Uses Next.js ImageResponse (no external image generation service needed).
 *
 * URL: /prodotti/{slug}/opengraph-image
 * Auto-discovered by Next.js metadata API — shows up as og:image on social shares.
 */
export const runtime = 'edge';
export const alt = 'GLORYBELLE — Gioielleria Artigianale Italiana';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #132F26 0%, #1F4D3E 50%, #14201C 100%)',
          color: '#F6F1E7',
          fontFamily: 'serif',
          padding: '80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '40px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 9l8 13 8-13-8-7z" stroke="#B9924F" strokeWidth="1.3" strokeLinejoin="round" />
            <path d="M4 9h16M8.5 9L12 2l3.5 7" stroke="#E4C583" strokeWidth="1" opacity="0.6" />
          </svg>
          <span style={{ fontSize: '28px', letterSpacing: '0.18em', fontWeight: 500, color: '#E4C583' }}>
            GLORYBELLE
          </span>
        </div>
        <div style={{ fontSize: '56px', fontWeight: 500, textAlign: 'center', lineHeight: 1.15 }}>
          Gioielleria<br />Artigianale Italiana
        </div>
        <div style={{ marginTop: '32px', fontSize: '20px', color: '#E4C583', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
          Oro 18K · Pietre tracciabili
        </div>
      </div>
    ),
    { ...size }
  );
}
