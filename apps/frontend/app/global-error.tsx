'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Fatal application error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>
          <h2>A critical error has occurred.</h2>
          <p>We are sorry for the inconvenience.</p>
          <button 
            onClick={() => reset()}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '4px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
