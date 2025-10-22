import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'GitHub Clone',
    template: '%s | GitHub Clone',
  },
  description:
    'A full-stack GitHub clone with repositories, issues, pull requests, discussions, and more. Built with Next.js 15, TypeScript, and Tailwind CSS.',
  keywords: [
    'github',
    'git',
    'repository',
    'code',
    'collaboration',
    'version control',
    'open source',
  ],
  authors: [{ name: 'GitHub Clone' }],
  creator: 'GitHub Clone',
  publisher: 'GitHub Clone',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'GitHub Clone',
    description: 'A full-stack GitHub clone with repositories, issues, pull requests, and more.',
    url: '/',
    siteName: 'GitHub Clone',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GitHub Clone',
    description: 'A full-stack GitHub clone with repositories, issues, pull requests, and more.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
