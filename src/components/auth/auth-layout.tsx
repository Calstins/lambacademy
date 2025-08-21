// components/auth/auth-layout.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-800 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full md:max-w-xl max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block">
              {/* <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 hover:bg-primary-800 transition-colors"> */}
              <Image src="/f.png" alt="Logo" width={60} height={60} />
              {/* <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg> */}
              {/* </div> */}
            </Link>
            <h1 className="text-3xl font-bold text-primary mb-2">{title}</h1>
            {subtitle && <p className="text-gray-600 text-sm">{subtitle}</p>}
          </div>
          {children}
        </div>
        <div className="text-center mt-6">
          <p className="text-white/80 text-sm">
            © 2025 LambAcademy. All rights reserved.
          </p>
          <p className="text-white/60 text-xs mt-2">
            <Link
              href="https://lambacademy.ng"
              className="hover:text-white transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              Visit our main website
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
