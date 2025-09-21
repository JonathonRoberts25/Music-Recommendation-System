import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import AuthProvider from '@/components/SessionProvider'; // <-- IMPORT

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spotify Mood Playlists',
  description: 'Generate playlists based on your mood',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider> {/* <-- WRAP */}
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}