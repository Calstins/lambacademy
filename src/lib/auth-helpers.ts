import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export async function getSessionSafe() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function requireAdminSafe() {
  const session = await getSessionSafe();
  const user = session?.user;
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function requireUserSafe() {
  const session = await getSessionSafe();
  return session?.user ?? null;
}
