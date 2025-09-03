// app/api/payment/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY!)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    // Handle successful payments
    if (event.event === 'charge.success') {
      const { reference, status, metadata } = event.data;

      if (status === 'success') {
        // Check if it's a section payment or course/full access payment
        if (metadata?.sectionId) {
          // Handle individual section payment
          const { sectionId, enrollmentId, courseId } = metadata;

          const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
          });

          if (enrollment && !enrollment.paidSections.includes(sectionId)) {
            await prisma.enrollment.update({
              where: { id: enrollmentId },
              data: {
                paidSections: {
                  push: sectionId,
                },
              },
            });
          }
        } else {
          // Handle course or full access payment
          const { courseId, userId, includeAllSections, paidSectionIds } =
            metadata;

          const updateData: any = { paymentStatus: 'COMPLETED' };

          // If this was a full access purchase, add all paid sections
          if (
            includeAllSections &&
            paidSectionIds &&
            Array.isArray(paidSectionIds)
          ) {
            updateData.paidSections = paidSectionIds;
          }

          const updated = await prisma.enrollment.updateMany({
            where: {
              paymentReference: reference,
              paymentStatus: 'PENDING',
            },
            data: updateData,
          });

          // If no enrollment found with reference, try to find by metadata
          if (updated.count === 0 && userId && courseId) {
            await prisma.enrollment.updateMany({
              where: {
                userId: userId,
                courseId: courseId,
                paymentStatus: 'PENDING',
              },
              data: {
                paymentStatus: 'COMPLETED',
                paymentReference: reference,
                ...(includeAllSections &&
                  paidSectionIds &&
                  Array.isArray(paidSectionIds) && {
                    paidSections: paidSectionIds,
                  }),
              },
            });
          }
        }

        console.log(`Payment successful: ${reference}`, {
          includeAllSections: metadata?.includeAllSections,
          paidSectionIds: metadata?.paidSectionIds,
        });
      }
    }

    // Handle failed payments
    if (event.event === 'charge.failed') {
      const { reference, metadata } = event.data;

      // Update course enrollment payment status to failed
      const updated = await prisma.enrollment.updateMany({
        where: { paymentReference: reference },
        data: { paymentStatus: 'FAILED' },
      });

      // If no enrollment found with reference, try to find by metadata
      if (updated.count === 0 && metadata?.userId && metadata?.courseId) {
        await prisma.enrollment.updateMany({
          where: {
            userId: metadata.userId,
            courseId: metadata.courseId,
            paymentStatus: 'PENDING',
          },
          data: { paymentStatus: 'FAILED' },
        });
      }

      console.log(`Payment failed: ${reference}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
