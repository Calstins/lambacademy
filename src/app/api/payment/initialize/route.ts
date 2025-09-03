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

    const {
      courseId,
      amount,
      includeAllSections = false,
    } = await request.json();

    // Validate course exists and is active
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          where: { isPaid: true },
          select: { id: true, price: true },
        },
      },
    });

    if (!course || !course.isActive) {
      return NextResponse.json(
        { error: 'Course not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: session.user.id,
          courseId: courseId,
        },
      },
    });

    if (
      existingEnrollment &&
      existingEnrollment.paymentStatus === 'COMPLETED'
    ) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 400 }
      );
    }

    const reference = paystackService.generateReference();

    // Prepare metadata based on purchase type
    const metadata: any = {
      courseId,
      userId: session.user.id,
      includeAllSections,
      purchaseType: includeAllSections ? 'FULL_ACCESS' : 'COURSE_ONLY',
    };

    // If including all sections, add section IDs to metadata
    if (includeAllSections && course.sections.length > 0) {
      metadata.paidSectionIds = course.sections.map((s) => s.id);
    }

    const paymentData = {
      amount: amount * 100, // Convert to kobo
      email: session.user.email!,
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      metadata,
    };

    console.log('Initializing payment with data:', {
      reference,
      amount: amount,
      courseId,
      includeAllSections,
      userId: session.user.id,
    });

    const result = await paystackService.initializePayment(paymentData);

    if (result.status) {
      // Create or update enrollment record with pending payment
      const enrollmentData = {
        userId: session.user.id,
        courseId,
        paymentReference: reference,
        paymentStatus: 'PENDING' as const,
        // If including all sections, pre-populate them (will be confirmed on payment success)
        ...(includeAllSections &&
          course.sections.length > 0 && {
            paidSections: [], // Will be populated after successful payment
          }),
      };

      if (existingEnrollment) {
        await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            paymentReference: reference,
            paymentStatus: 'PENDING',
          },
        });
      } else {
        await prisma.enrollment.create({
          data: enrollmentData,
        });
      }

      console.log(
        'Payment initialized successfully:',
        result.data.authorization_url
      );

      return NextResponse.json({
        authorization_url: result.data.authorization_url,
        reference,
        courseId,
      });
    } else {
      console.error('Paystack initialization failed:', result);
      return NextResponse.json(
        { error: 'Payment initialization failed', details: result.message },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
