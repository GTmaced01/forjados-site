import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://forjados-site.vercel.app'),

  title: 'FORJADOS — Retiro de Cura e Restauração',

  description:
    'A forja não era para te destruir. Era para te transformar. Um retiro de cura, perdão, identidade e restauração em Deus.',

  openGraph: {
    title: 'FORJADOS — Retiro de Cura e Restauração',
    description:
      'A forja não era para te destruir. Era para te transformar.',
    url: 'https://forjados-site.vercel.app',
    siteName: 'FORJADOS',
    locale: 'pt_BR',
    type: 'website',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'FORJADOS — Retiro de Cura e Restauração',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'FORJADOS — Retiro de Cura e Restauração',
    description:
      'A forja não era para te destruir. Era para te transformar.',
    images: ['/opengraph-image.png'],
  },

  icons: {
    icon: '/logo-forjados.png',
    apple: '/logo-forjados.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>{children}</body>
    </html>
  );
}