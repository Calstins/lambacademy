'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function getSessionSafe() {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch {
    return null;
  }
}

export async function requireAdminSafe() {
  const session = await getSessionSafe();
  const user = session?.user;
  if (!user || user.role !== 'ADMIN') return null;
  return user;
}

export async function requireUserSafe() {
  const session = await getSessionSafe();
  return session?.user ?? null;
}

// Helper function to check admin authorization
async function checkAdminAuth() {
  const user = await requireAdminSafe();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function getAnalyticsData() {
  await checkAdminAuth();

  const [
    totalCourses,
    totalUsers,
    totalEnrollments,
    enrollments,
    totalStudents,
    completedEnrollments,
    certificates,
  ] = await Promise.all([
    prisma.course.count(),
    prisma.user.count(),
    prisma.enrollment.count(),
    prisma.enrollment.findMany({
      include: {
        course: {
          select: { price: true, isPaid: true, title: true },
        },
      },
    }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.enrollment.count({
      where: { completedAt: { not: null } },
    }),
    prisma.certificate.count(),
  ]);

  const totalRevenue = enrollments.reduce((sum, enrollment) => {
    if (enrollment.course.isPaid && enrollment.paymentStatus === 'COMPLETED') {
      return sum + (enrollment.course.price || 0);
    }
    return sum;
  }, 0);

  const completionRate =
    totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  // Top performing courses
  const topCourses = await prisma.course.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
      enrollments: {
        where: { paymentStatus: 'COMPLETED' },
      },
    },
    orderBy: {
      enrollments: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  const topCoursesWithStats = topCourses.map((course) => {
    const completedCount = course.enrollments.filter(
      (e) => e.completedAt
    ).length;
    const completionRate =
      course._count.enrollments > 0
        ? (completedCount / course._count.enrollments) * 100
        : 0;
    const revenue = course.isPaid
      ? course.enrollments.length * (course.price || 0)
      : 0;

    return {
      ...course,
      completionRate: Math.round(completionRate),
      revenue,
    };
  });

  // Course statistics
  const courseStats = await prisma.course.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
      enrollments: {
        where: { paymentStatus: 'COMPLETED' },
      },
    },
  });

  const courseStatsWithMetrics = courseStats.map((course) => {
    const completedCount = course.enrollments.filter(
      (e) => e.completedAt
    ).length;
    const completionPercentage =
      course._count.enrollments > 0
        ? Math.round((completedCount / course._count.enrollments) * 100)
        : 0;
    const revenue = course.isPaid
      ? course.enrollments.filter((e) => e.paymentStatus === 'COMPLETED')
          .length * (course.price || 0)
      : 0;

    return {
      ...course,
      completedCount,
      completionPercentage,
      revenue,
    };
  });

  // Monthly enrollment trends (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const monthlyEnrollments = await prisma.enrollment.groupBy({
    by: ['enrolledAt'],
    where: {
      enrolledAt: {
        gte: sixMonthsAgo,
      },
    },
    _count: {
      id: true,
    },
  });

  // Group by month
  const monthlyEnrollmentData = monthlyEnrollments.reduce(
    (acc: any, enrollment) => {
      const month = new Date(enrollment.enrolledAt).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'short',
        }
      );
      acc[month] = (acc[month] || 0) + enrollment._count.id;
      return acc;
    },
    {}
  );

  const monthlyEnrollmentArray = Object.entries(monthlyEnrollmentData).map(
    ([month, count]) => ({
      month,
      count,
    })
  );

  // Monthly revenue trends
  const monthlyRevenueData = enrollments
    .filter(
      (e) =>
        e.course.isPaid &&
        e.paymentStatus === 'COMPLETED' &&
        e.enrolledAt >= sixMonthsAgo
    )
    .reduce((acc: any, enrollment) => {
      const month = new Date(enrollment.enrolledAt).toLocaleDateString(
        'en-US',
        {
          year: 'numeric',
          month: 'short',
        }
      );
      acc[month] = (acc[month] || 0) + (enrollment.course.price || 0);
      return acc;
    }, {});

  const monthlyRevenueArray = Object.entries(monthlyRevenueData).map(
    ([month, revenue]) => ({
      month,
      revenue,
    })
  );

  const maxMonthlyEnrollments = Math.max(
    ...monthlyEnrollmentArray.map((m) => m.count as number)
  );
  const maxMonthlyRevenue = Math.max(
    ...monthlyRevenueArray.map((m) => m.revenue as number)
  );

  // Recent activity (for engagement metrics)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recent = await prisma.enrollment.findMany({
    where: { enrolledAt: { gte: oneWeekAgo } },
    select: { userId: true },
  });

  const activeStudents = new Set(recent.map((r) => r.userId)).size;

  return {
    totalCourses,
    totalUsers,
    totalStudents,
    totalEnrollments,
    totalRevenue,
    completionRate,
    certificatesIssued: certificates,
    courseViews: totalEnrollments * 5,
    activeStudents,
    topCourses: topCoursesWithStats,
    courseStats: courseStatsWithMetrics,
    monthlyEnrollments: monthlyEnrollmentArray,
    monthlyRevenue: monthlyRevenueArray,
    maxMonthlyEnrollments,
    maxMonthlyRevenue,
  };
}
