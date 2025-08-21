// app/api/payment/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { paystackService } from '@/lib/paystack';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { courseId, amount } = await request.json();

    const reference = paystackService.generateReference();

    const paymentData = {
      amount: amount * 100, // Convert to kobo
      email: session.user.email!,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata: {
        courseId,
        userId: session.user.id,
      },
    };

    const result = await paystackService.initializePayment(paymentData);

    if (result.status) {
      // Create enrollment record with pending payment
      await prisma.enrollment.create({
        data: {
          userId: session.user.id,
          courseId,
          paymentReference: reference,
          paymentStatus: 'PENDING',
        },
      });

      return NextResponse.json({
        authorization_url: result.data.authorization_url,
        reference,
      });
    } else {
      return NextResponse.json(
        { error: 'Payment initialization failed' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
