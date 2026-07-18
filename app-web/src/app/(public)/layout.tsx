import type { Metadata } from 'next';
import { Cinzel } from 'next/font/google';
import '../globals.css';
import { Providers } from '@/providers';
import ThemeInitializer from '@/shared/components/ThemeInitializer';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cinzel = Cinzel({
  variable: '--font-cinzel',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'HUB',
  description: 'Hub de Ferramentas',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-br"
      className={`${cinzel.variable} h-full antialiased`}
    >
      <body>
        <Providers>
          <ThemeInitializer />
          <ToastContainer className="toast-container" />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
