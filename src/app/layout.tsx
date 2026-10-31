import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Encore Une 3ème Fourchette — Cuisine maison',
  description: 'Croissants, shnecks, petits gâteaux, harissa, merguez, recettes tunisiennes… Cuisine 100 % maison, commandez en quelques clics.',
  icons: {
    icon: '/3f.png',
    shortcut: '/3f.png',
    apple: '/3f.png',
  },
};
export const viewport: Viewport = { themeColor: '#1B5E20', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
