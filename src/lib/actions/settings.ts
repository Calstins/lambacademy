// lib/actions/settings.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

// Add this to your Prisma schema:
// model SystemSetting {
//   id    String @id @default(cuid()) @map("_id")
//   key   String @unique
//   value String
//   @@map("system_settings")
// }

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

async function checkAdminAuth() {
  const user = await requireAdminSafe();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getSystemSettings() {
  await checkAdminAuth();

  try {
    const settings = await prisma.systemSetting.findMany();

    const settingsObject = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    return {
      // Payment Settings
      paystackPublicKey: settingsObject.paystackPublicKey || '',
      paystackSecretKey: settingsObject.paystackSecretKey || '',
      paystackTestMode: settingsObject.paystackTestMode === 'true',

      // Email Settings
      emailProvider: settingsObject.emailProvider || 'resend',
      emailApiKey: settingsObject.emailApiKey || '',
      emailFromAddress:
        settingsObject.emailFromAddress || 'noreply@lambacademy.ng',
      emailFromName: settingsObject.emailFromName || 'LambAcademy',

      // Platform Settings
      platformName:
        settingsObject.platformName || 'LambAcademy Learning Portal',
      platformDescription:
        settingsObject.platformDescription ||
        'Transform your future through quality online education',
      platformUrl: settingsObject.platformUrl || 'https://app.lambacademy.ng',
      supportEmail: settingsObject.supportEmail || 'support@lambacademy.ng',
      supportPhone: settingsObject.supportPhone || '',

      // Security Settings
      sessionTimeout: parseInt(settingsObject.sessionTimeout) || 168,
      maxLoginAttempts: parseInt(settingsObject.maxLoginAttempts) || 5,
      passwordMinLength: parseInt(settingsObject.passwordMinLength) || 8,
      requireEmailVerification:
        settingsObject.requireEmailVerification === 'true',

      // Certificate Settings
      certificateTemplate: settingsObject.certificateTemplate || '',
      certificateSignature: settingsObject.certificateSignature || '',
      certificateRequireCompletion:
        settingsObject.certificateRequireCompletion === 'true',
      certificateRequireMinScore:
        settingsObject.certificateRequireMinScore === 'true',
      certificateMinScore: parseInt(settingsObject.certificateMinScore) || 70,
    };
  } catch (error) {
    // Return defaults if no settings exist yet
    return {
      paystackPublicKey: '',
      paystackSecretKey: '',
      paystackTestMode: true,
      emailProvider: 'resend',
      emailApiKey: '',
      emailFromAddress: 'noreply@lambacademy.ng',
      emailFromName: 'LambAcademy',
      platformName: 'LambAcademy Learning Portal',
      platformDescription:
        'Transform your future through quality online education',
      platformUrl: 'https://app.lambacademy.ng',
      supportEmail: 'support@lambacademy.ng',
      supportPhone: '',
      sessionTimeout: 168,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireEmailVerification: false,
      certificateTemplate: '',
      certificateSignature: '',
      certificateRequireCompletion: true,
      certificateRequireMinScore: false,
      certificateMinScore: 70,
    };
  }
}

export async function updateSystemSettings(settings: any) {
  await checkAdminAuth();

  try {
    // Update or create each setting
    const settingEntries = Object.entries(settings);

    await Promise.all(
      settingEntries.map(([key, value]) =>
        prisma.systemSetting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update settings' };
  }
}
