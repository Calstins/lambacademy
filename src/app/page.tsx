import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Welcome to LambAcademy Student Portal',
  description:
    "Your gateway to quality online education. Access courses, track your progress, and advance your career with LambAcademy's comprehensive learning platform.",
  openGraph: {
    title: 'Welcome to LambAcademy Student Portal',
    description:
      'Your gateway to quality online education. Access courses, track your progress, and advance your career.',
    url: 'https://app.lambacademy.ng',
  },
  twitter: {
    title: 'Welcome to LambAcademy Student Portal',
    description:
      'Your gateway to quality online education. Access courses, track your progress, and advance your career.',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-800 to-primary-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
            <svg
              className="w-12 h-12 text-primary"
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
            </svg>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to <span className="text-accent">LambAcademy</span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Your gateway to quality online education. Access courses, track your
            progress, and advance your career with our comprehensive learning
            platform.
          </p>

          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link href="/login">
              <Button
                size="lg"
                className="w-full md:w-auto bg-white text-primary hover:bg-gray-100"
              >
                Student Login
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="w-full md:w-auto border-white text-white hover:bg-white hover:text-primary"
              >
                Create Account
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
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
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Quality Courses</h3>
              <p className="text-white/80">
                Access professionally designed courses across various
                disciplines
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-white/80">
                Monitor your learning journey with detailed progress tracking
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
              <p className="text-white/80">
                Get guidance from experienced instructors and mentors
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="text-center py-8 text-white/60">
        <p>&copy; 2025 LambAcademy. All rights reserved.</p>
        <p className="mt-2">
          <a
            href="https://lambacademy.ng"
            className="hover:text-white transition-colors"
          >
            Visit our main website
          </a>
        </p>
      </footer>
    </div>
  );
}
