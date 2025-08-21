// app/api/payment/section/initialize/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { paystackService } from '@/lib/paystack';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { sectionId, courseId, amount } = await request.json();

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { course: true },
    });
    if (!section || !section.isPaid) {
      return NextResponse.json({ error: 'Invalid section' }, { status: 400 });
    }

    // ✅ FIX: findFirst with both conditions
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: session.user.id, courseId, paymentStatus: 'COMPLETED' },
      select: { id: true, paidSections: true },
    });
    if (!enrollment) {
      return NextResponse.json(
        { error: 'Not enrolled in course' },
        { status: 400 }
      );
    }
    if (enrollment.paidSections.includes(sectionId)) {
      return NextResponse.json(
        { error: 'Section already purchased' },
        { status: 400 }
      );
    }

    const reference = paystackService.generateReference();
    const paymentData = {
      amount: amount * 100,
      email: session.user.email!,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback?type=section`,
      metadata: {
        sectionId,
        courseId,
        userId: session.user.id,
        enrollmentId: enrollment.id,
      },
    };

    const result = await paystackService.initializePayment(paymentData);
    if (!result.status) {
      return NextResponse.json(
        { error: 'Payment initialization failed' },
        { status: 400 }
      );
    }

    // Store for callback convenience (optional)
    return NextResponse.json({
      authorization_url: result.data.authorization_url,
      reference,
    });
  } catch (e) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
