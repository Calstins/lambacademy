// app/auth/redirect/page.tsx
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function PostLoginRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  // Not signed in? back to login
  if (!session?.user) redirect('/login');

  // Route by role (server-truth)
  if (session.user.role === 'ADMIN') {
    redirect('/admin');
  }

  redirect('/dashboard');
}
