import type { Metadata } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';
import ChatPanel from '@/components/ChatPanel';
import './globals.css';

export const metadata: Metadata = {
  title: 'Filght - AI-Powered Flight Booking',
  description: 'Find the cheapest flights with AI-powered price tracking and recommendations.'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="bg-dark text-white">
        <AuthProvider>
          <Providers>
            <Navbar />
            <main className="min-h-screen bg-dark">
              {children}
            </main>
            <ChatPanel />
          </Providers>
        </AuthProvider>
      </body>
    </html>
  );
}
