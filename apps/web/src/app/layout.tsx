import type { Metadata } from 'next';
import { AuthProvider } from '../context/AuthContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'CrowdMind AI | Predictive Stadium Operations',
  description: 'AI-powered Predictive Stadium Operations and Crowd Management Platform.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const missingVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ].filter((key) => !process.env[key]);

  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100">
        {missingVars.length > 0 && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              borderBottom: '1px solid #334155',
              padding: '12px 24px',
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ color: '#f59e0b', fontSize: '18px' }}>⚠️</span>
            <span>
              <strong style={{ color: '#fbbf24' }}>Firebase env vars missing.</strong>{' '}
              Set these in Vercel → Settings → Environment Variables:{' '}
              <code style={{ color: '#38bdf8' }}>{missingVars.join(', ')}</code>
            </span>
          </div>
        )}
        <AccessibilityProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-slate-950 focus:text-sky-400 focus:border focus:border-sky-500 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-xs tracking-wider uppercase"
          >
            Skip to Main Content
          </a>
          <AuthProvider>
            {children}
          </AuthProvider>
        </AccessibilityProvider>
      </body>
    </html>
  );
}
