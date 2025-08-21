// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/paystack';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    const result = await paystackService.verifyPayment(reference);

    if (result.status && result.data.status === 'success') {
      // Update enrollment payment status
      await prisma.enrollment.updateMany({
        where: { paymentReference: reference },
        data: { paymentStatus: 'COMPLETED' },
      });

      return NextResponse.json({ success: true });
    } else {
      // Update enrollment payment status to failed
      await prisma.enrollment.updateMany({
        where: { paymentReference: reference },
        data: { paymentStatus: 'FAILED' },
      });

      return NextResponse.json({ success: false });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
