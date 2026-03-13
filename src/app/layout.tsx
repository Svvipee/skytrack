import type { Metadata, Viewport } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/Auth/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkyTrack — Live Global Flight Tracker',
  description: 'Real-time live flight tracking on an interactive 3D globe. Track aircraft worldwide, explore flight details, and save your favorite flights.',
  keywords: ['flight tracker', 'live flights', 'aircraft tracking', 'aviation', '3D globe', 'real-time'],
  authors: [{ name: 'SkyTrack' }],
  openGraph: {
    title: 'SkyTrack — Live Global Flight Tracker',
    description: 'Real-time live flight tracking on an interactive 3D globe.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#06b6d4',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
