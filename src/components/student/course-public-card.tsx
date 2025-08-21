'use client';

import { useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';

type Props = {
  courseId: string;
  title: string;
  description: string;
  isPaid: boolean;
  price?: number | null;
  // optionally precomputed totals to avoid extra fetch
  totals?: { coursePrice: number; sectionsTotal: number; total: number };
};

export default function CoursePublicCard({
  courseId,
  title,
  description,
  isPaid,
  price,
  totals,
}: Props) {
  const [isPending, startTransition] = useTransition();

  const payForCourse = () =>
    startTransition(async () => {
      try {
        const amount = price ?? 0;
        const resp = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ courseId, amount }),
        });
        if (!resp.ok) throw new Error('init failed');
        const data = await resp.json();
        localStorage.setItem('pendingCourseId', courseId);
        window.location.href = data.authorization_url;
      } catch {
        toast.error('Unable to initialize payment');
      }
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <p className="text-sm text-gray-600">{description}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {isPaid ? (
          <>
            <div className="text-sm">
              Course price: <b>₦{(price ?? 0).toLocaleString()}</b>
            </div>
            {totals && (
              <>
                <div className="text-sm">
                  Paid sections total:{' '}
                  <b>₦{totals.sectionsTotal.toLocaleString()}</b>
                </div>
                <div className="text-sm">
                  Total cost to access everything:{' '}
                  <b>₦{totals.total.toLocaleString()}</b>
                </div>
              </>
            )}
            <Button
              className="bg-primary hover:bg-primary-800"
              onClick={payForCourse}
              disabled={isPending}
            >
              {isPending
                ? 'Redirecting…'
                : `Buy Course for ₦${(price ?? 0).toLocaleString()}`}
            </Button>
          </>
        ) : (
          <div className="text-sm">This course is free to enroll.</div>
        )}
      </CardContent>
    </Card>
  );
}
