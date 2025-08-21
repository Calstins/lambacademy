// lib/actions/public.ts
'use server';

import { prisma } from '@/lib/prisma';

export async function getCoursePricing(courseId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: { select: { id: true, isPaid: true, price: true } },
    },
  });
  if (!course) throw new Error('Course not found');

  const sectionsTotal = course.sections
    .filter((s) => s.isPaid && s.price)
    .reduce((sum, s) => sum + (s.price ?? 0), 0);

  const coursePrice = course.isPaid ? course.price ?? 0 : 0;
  const total = coursePrice + sectionsTotal;

  return {
    courseId,
    coursePrice,
    sectionsTotal,
    total,
    breakdown: course.sections.map((s) => ({
      id: s.id,
      isPaid: s.isPaid,
      price: s.price ?? 0,
    })),
  };
}
