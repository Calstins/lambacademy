// app/api/auth/[...all]/route.ts
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const runtime = 'nodejs'; // <— important
export const dynamic = 'force-dynamic'; // optional, avoids caching issues

export const { GET, POST } = toNextJsHandler(auth.handler);
