'use server';

import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export type RegisterResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function registerUser(form: FormData): Promise<RegisterResult> {
  const h = await headers();

  const get = (k: string) => {
    const v = form.get(k);
    return v === null || v === '' ? undefined : String(v).trim();
  };

  // Full name (surname first)
  const rawName = get('name');

  if (!rawName)
    return { ok: false, error: 'Full name is required (surname first)' };
  const parts = rawName.split(/\s+/);
  if (parts.length < 2)
    return {
      ok: false,
      error:
        'Enter surname first, then at least one other name (e.g., "Okafor Caleb")',
    };

  const normalize = (s: string) =>
    s
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase()); // Title Case basic
  const cleanName = normalize(rawName);

  const surname = parts[0];
  const givenNames = parts.slice(1).join(' ');

  const dobStr = get('dateOfBirth');
  const dateOfBirth = dobStr ? new Date(dobStr) : undefined;

  try {
    const res = await auth.api.signUpEmail({
      headers: h,
      body: {
        // Better Auth core fields
        name: cleanName,
        email: get('email')!,
        password: get('password')!,

        // Flattened additional fields (must match your betterAuth user.additionalFields)
        firstName: givenNames,
        lastName: surname,
        phone: get('phone')!,
        gender: get('gender') as 'MALE' | 'FEMALE',
        dateOfBirth,
        department: get('department'),
        course: get('course'),
        address: get('address'),
        state: get('state'),
        country: get('country'),
        // role omitted -> default STUDENT from your config
      },
    });

    // Treat “has user” as success
    if (
      res &&
      typeof res === 'object' &&
      'user' in res &&
      (res as any).user?.id
    ) {
      return { ok: true, userId: (res as any).user.id };
    }

    const msg =
      (res as any)?.error?.message ||
      (res as any)?.message ||
      'Registration failed';
    return { ok: false, error: msg };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Registration failed' };
  }
}
