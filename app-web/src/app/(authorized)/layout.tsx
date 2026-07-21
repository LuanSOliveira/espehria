import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import '../globals.css';
import { Providers } from '@/providers';
import ThemeInitializer from '@/shared/components/ThemeInitializer';
import { EntityMentionViewDispatcher } from '@/shared/components/EntityMentionViewDispatcher';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthorizedShell } from './components/AuthorizedShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Espehria',
  description: 'Espehria',
};

export default function AuthorizedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body>
        <Providers>
          <ThemeInitializer />
          <EntityMentionViewDispatcher />
          <ToastContainer className="toast-container" />
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: -1,
              backgroundImage: 'url(/app-bg.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <AuthorizedShell>{children}</AuthorizedShell>
        </Providers>
      </body>
    </html>
  );
}
