// lib/auth.ts
import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: 'mongodb',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  socialProviders: {
    // Add social providers if needed
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    additionalFields: {
      firstName: {
        type: 'string',
        required: true,
      },
      lastName: {
        type: 'string',
        required: true,
      },
      phone: {
        type: 'string',
        required: true,
      },
      dateOfBirth: {
        type: 'date',
        required: false,
      },
      gender: {
        type: 'string',
        required: true,
      },
      department: {
        type: 'string',
        required: false,
      },
      course: {
        type: 'string',
        required: false,
      },
      address: {
        type: 'string',
        required: false,
      },
      state: {
        type: 'string',
        required: false,
      },
      country: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: true,
        defaultValue: 'STUDENT',
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
