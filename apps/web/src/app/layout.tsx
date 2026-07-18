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
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
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
