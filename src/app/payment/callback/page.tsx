// app/payment/callback/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2, BookOpen, Unlock } from 'lucide-react';
import Link from 'next/link';

function PaymentCallbackContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(
    'loading'
  );
  const [courseId, setCourseId] = useState<string | null>(null);
  const [paymentType, setPaymentType] = useState<'course' | 'section'>(
    'course'
  );
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  const type = searchParams.get('type'); // to distinguish between course and section payments

  useEffect(() => {
    if (reference) {
      // Determine payment type from URL parameter or default to course
      const detectedType = (type as 'course' | 'section') || 'course';
      setPaymentType(detectedType);

      if (detectedType === 'section') {
        verifySectionPayment(reference);
      } else {
        verifyCoursePayment(reference);
      }
    } else {
      setStatus('failed');
    }
  }, [reference, type]);

  const verifyCoursePayment = async (ref: string) => {
    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      });

      const result = await response.json();
      setStatus(result.success ? 'success' : 'failed');

      // Get course ID from response or storage
      if (result.courseId) {
        setCourseId(result.courseId);
      } else {
        const storedCourseId = localStorage.getItem('pendingCourseId');
        if (storedCourseId) {
          setCourseId(storedCourseId);
          localStorage.removeItem('pendingCourseId');
        }
      }
    } catch (error) {
      console.error('Course payment verification error:', error);
      setStatus('failed');
    }
  };

  const verifySectionPayment = async (ref: string) => {
    try {
      const response = await fetch('/api/payment/section/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: ref }),
      });

      const result = await response.json();
      setStatus(result.success ? 'success' : 'failed');

      // Get course ID from response or storage
      if (result.courseId) {
        setCourseId(result.courseId);
      } else {
        const storedCourseId = localStorage.getItem('pendingSectionCourseId');
        if (storedCourseId) {
          setCourseId(storedCourseId);
          localStorage.removeItem('pendingSectionCourseId');
        }
      }
    } catch (error) {
      console.error('Section payment verification error:', error);
      setStatus('failed');
    }
  };

  const getSuccessContent = () => {
    if (paymentType === 'section') {
      return {
        icon: <Unlock className="w-16 h-16 mx-auto text-green-500" />,
        title: 'Section Unlocked!',
        description:
          'Your payment has been processed successfully. The premium section is now available for you to access.',
        primaryButtonText: 'Access Course Content',
        primaryButtonIcon: <Unlock className="w-4 h-4 mr-2" />,
      };
    } else {
      return {
        icon: <CheckCircle className="w-16 h-16 mx-auto text-green-500" />,
        title: 'Payment Successful!',
        description:
          'Your payment has been processed successfully. You now have access to your course content.',
        primaryButtonText: 'Go to Dashboard',
        primaryButtonIcon: <BookOpen className="w-4 h-4 mr-2" />,
      };
    }
  };

  const getFailureContent = () => {
    if (paymentType === 'section') {
      return {
        title: 'Section Purchase Failed',
        description:
          "We couldn't process your section purchase. Please try again or contact support if the issue persists.",
      };
    } else {
      return {
        title: 'Payment Failed',
        description:
          "We couldn't process your payment. Please try again or contact support if the issue persists.",
      };
    }
  };

  const successContent = getSuccessContent();
  const failureContent = getFailureContent();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {paymentType === 'section'
              ? 'Section Purchase Status'
              : 'Payment Status'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
              <p className="text-gray-600">
                {paymentType === 'section'
                  ? 'Verifying your section purchase...'
                  : 'Verifying your payment...'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              {successContent.icon}
              <div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  {successContent.title}
                </h3>
                <p className="text-gray-600">{successContent.description}</p>
              </div>
              <div className="space-y-2">
                {courseId && paymentType === 'section' ? (
                  <Link href={`/dashboard/courses/${courseId}`}>
                    <Button className="w-full bg-primary hover:bg-primary-800">
                      {successContent.primaryButtonIcon}
                      {successContent.primaryButtonText}
                    </Button>
                  </Link>
                ) : paymentType === 'course' ? (
                  <Link href="/dashboard">
                    <Button className="w-full bg-primary hover:bg-primary-800">
                      {successContent.primaryButtonIcon}
                      {successContent.primaryButtonText}
                    </Button>
                  </Link>
                ) : (
                  <Link href="/dashboard/courses">
                    <Button className="w-full bg-primary hover:bg-primary-800">
                      <BookOpen className="w-4 h-4 mr-2" />
                      View My Courses
                    </Button>
                  </Link>
                )}
                <Link href="/dashboard/courses">
                  <Button variant="outline" className="w-full">
                    View My Courses
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-red-500" />
              <div>
                <h3 className="text-xl font-semibold text-red-700 mb-2">
                  {failureContent.title}
                </h3>
                <p className="text-gray-600">{failureContent.description}</p>
              </div>
              <div className="space-y-2">
                <Link href="/dashboard/browse">
                  <Button className="w-full bg-primary hover:bg-primary-800">
                    Try Again
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Go to Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentCallbackSuspense() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Payment Status</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-primary" />
          <p className="text-gray-600">Loading payment status...</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <Suspense fallback={<PaymentCallbackSuspense />}>
      <PaymentCallbackContent />
    </Suspense>
  );
}
