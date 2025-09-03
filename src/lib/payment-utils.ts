// lib/payment-utils.ts

interface CourseWithSections {
  id: string;
  isPaid: boolean;
  price?: number;
  sections: {
    id: string;
    isPaid: boolean;
    price?: number;
  }[];
}

export interface PriceBreakdown {
  coursePrice: number;
  sectionsPrice: number;
  totalPrice: number;
  paidSections: { id: string; price: number }[];
}

/**
 * Calculate the total price for a course including all paid sections
 */
export function calculateCourseFullPrice(
  course: CourseWithSections
): PriceBreakdown {
  const coursePrice = course.isPaid ? course.price || 0 : 0;

  const paidSections = course.sections
    .filter((section) => section.isPaid)
    .map((section) => ({
      id: section.id,
      price: section.price || 0,
    }));

  const sectionsPrice = paidSections.reduce(
    (sum, section) => sum + section.price,
    0
  );
  const totalPrice = coursePrice + sectionsPrice;

  return {
    coursePrice,
    sectionsPrice,
    totalPrice,
    paidSections,
  };
}

/**
 * Calculate the price for course only (without sections)
 */
export function calculateCourseOnlyPrice(course: CourseWithSections): number {
  return course.isPaid ? course.price || 0 : 0;
}

/**
 * Format price for display
 */
export function formatPrice(amount: number): string {
  return `₦${amount.toLocaleString()}`;
}

/**
 * Validate payment amount matches expected course pricing
 */
export function validatePaymentAmount(
  course: CourseWithSections,
  amount: number,
  includeAllSections: boolean
): boolean {
  if (includeAllSections) {
    const breakdown = calculateCourseFullPrice(course);
    return breakdown.totalPrice === amount;
  } else {
    const coursePrice = calculateCourseOnlyPrice(course);
    return coursePrice === amount;
  }
}
