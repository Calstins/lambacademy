// app/layout.tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { uploadRouter } from '@/app/api/uploadthing/core';
// import '@uploadthing/react/styles.css';
import './globals.css';

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
    default: 'LambAcademy Student Portal - Online Learning Platform',
    template: '%s | LambAcademy Student Portal',
  },
  description:
    "Access your courses, track progress, and enhance your skills with LambAcademy's comprehensive online learning platform. Join thousands of students advancing their careers through quality education.",
  keywords: [
    'online learning',
    'education portal',
    'student dashboard',
    'courses',
    'skill development',
    'LambAcademy',
    'e-learning platform',
  ],
  authors: [{ name: 'LambAcademy' }],
  creator: 'LambAcademy',
  publisher: 'LambAcademy',
  metadataBase: new URL('https://app.lambacademy.ng'),
  alternates: {
    canonical: 'https://app.lambacademy.ng',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.lambacademy.ng',
    siteName: 'LambAcademy Student Portal',
    title: 'LambAcademy Student Portal - Online Learning Platform',
    description:
      "Access your courses, track progress, and enhance your skills with LambAcademy's comprehensive online learning platform.",
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'LambAcademy Student Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LambAcademy Student Portal - Online Learning Platform',
    description:
      "Access your courses, track progress, and enhance your skills with LambAcademy's comprehensive online learning platform.",
    images: ['/twitter-image.jpg'],
    creator: '@lambacademy',
  },
  icons: {
    icon: '/favicon-32x32.png',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
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
  // verification: {
  //   google: 'your-google-verification-code',
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextSSRPlugin routerConfig={extractRouterConfig(uploadRouter)} />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
