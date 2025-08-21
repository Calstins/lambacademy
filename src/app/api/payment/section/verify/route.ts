// app/api/payment/section/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/paystack';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();
    const result = await paystackService.verifyPayment(reference);

    if (result.status && result.data.status === 'success') {
      const { sectionId, enrollmentId, courseId } = result.data.metadata;

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
      });
      if (enrollment && !enrollment.paidSections.includes(sectionId)) {
        await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: { paidSections: [...enrollment.paidSections, sectionId] },
        });
      }

      return NextResponse.json({ success: true, courseId });
    }
    return NextResponse.json({ success: false });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
