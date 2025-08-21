import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Student Login',
  description:
    'Sign in to your LambAcademy student account to access your courses, track progress, and continue your learning journey.',
  openGraph: {
    title: 'Student Login - LambAcademy Portal',
    description:
      'Sign in to your LambAcademy student account to access your courses and continue learning.',
    url: 'https://app.lambacademy.ng/login',
  },
  twitter: {
    title: 'Student Login - LambAcademy Portal',
    description:
      'Sign in to your LambAcademy student account to access your courses and continue learning.',
  },
  robots: {
    index: false, // Don't index login pages
    follow: false,
  },
};

export default function LoginPage() {
  return <LoginForm />;
}
