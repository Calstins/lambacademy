// app/api/payment/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { paystackService } from '@/lib/paystack';

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json();

    console.log('Verifying payment with reference:', reference);

    const result = await paystackService.verifyPayment(reference);

    if (result.status && result.data.status === 'success') {
      const { metadata } = result.data;
      const { courseId, userId, includeAllSections, paidSectionIds } = metadata;

      console.log('Payment verification successful:', {
        reference,
        courseId,
        includeAllSections,
        paidSectionIds,
      });

      // Find the enrollment to update
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          paymentReference: reference,
          userId: userId,
          courseId: courseId,
        },
      });

      if (!enrollment) {
        console.error('Enrollment not found for reference:', reference);
        return NextResponse.json(
          { success: false, error: 'Enrollment not found' },
          { status: 404 }
        );
      }

      // Update enrollment based on purchase type
      const updateData: any = {
        paymentStatus: 'COMPLETED',
      };

      // If this was a full access purchase, add all paid sections
      if (
        includeAllSections &&
        paidSectionIds &&
        Array.isArray(paidSectionIds)
      ) {
        updateData.paidSections = paidSectionIds;
        console.log('Adding paid sections to enrollment:', paidSectionIds);
      }

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: updateData,
      });

      console.log('Enrollment updated successfully');

      return NextResponse.json({
        success: true,
        courseId,
        enrollmentId: enrollment.id,
      });
    } else {
      console.log('Payment verification failed:', result);

      // Update enrollment payment status to failed
      await prisma.enrollment.updateMany({
        where: { paymentReference: reference },
        data: { paymentStatus: 'FAILED' },
      });

      return NextResponse.json({ success: false });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
