import { ImageResponse } from 'next/og';

// Next serves this as the default social preview for every route that doesn't
// set its own openGraph.images. Events with an uploaded image override it;
// events without one used to point at /og-default.png, which never existed.

export const alt = 'IllinoisTrivia.com — trivia night fundraisers across Illinois';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
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
          backgroundColor: '#0B1C3A',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 900, letterSpacing: -2 }}>
          <span style={{ color: 'white' }}>Illinois</span>
          <span style={{ color: '#C83803' }}>Trivia</span>
          <span style={{ color: 'white' }}>.com</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 34, color: '#C9D2E3' }}>
          Trivia night fundraisers across Illinois
        </div>
        <div
          style={{
            marginTop: 48,
            height: 8,
            width: 220,
            backgroundColor: '#C83803',
            borderRadius: 4,
          }}
        />
      </div>
    ),
    size,
  );
}
