import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/register-form';

export const metadata: Metadata = {
  title: 'Create Student Account',
  description:
    'Join LambAcademy today! Create your student account to access quality online courses and start your learning journey with expert instructors.',
  openGraph: {
    title: 'Create Student Account - LambAcademy Portal',
    description:
      'Join LambAcademy today! Create your student account to access quality online courses.',
    url: 'https://app.lambacademy.ng/register',
  },
  twitter: {
    title: 'Create Student Account - LambAcademy Portal',
    description:
      'Join LambAcademy today! Create your student account to access quality online courses.',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
