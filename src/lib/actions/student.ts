// lib/actions/student.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { utapi } from '@/lib/utapi';

export type QuizDTO = {
  id: string;
  title: string;
  questions: {
    id: string;
    order: number;
    question: string;
    options: string[];
  }[];
};

export type AssignmentDTO = {
  id: string;
  title: string;
  description: string;
  dueDate: string | Date | null;
  mySubmission?: {
    id: string;
    content: string;
    grade?: number | null;
    feedback?: string | null;
    submittedAt: string;
  };
};

export type SubmitQuizResult = {
  success: boolean;
  score?: number;
  maxScore?: number;
  error?: string;
};

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

// Helper function to check student authorization
async function checkAuth() {
  const user = await requireUserSafe();
  if (!user) redirect('/login');
  return user;
}

// Enhanced certificate SVG for Lagos Aviation Maritime Business Academy
function buildCertificateSVG(opts: {
  student: string;
  course: string;
  date: string;
  scoreText?: string;
}) {
  const { student, course, date, scoreText } = opts;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1131" viewBox="0 0 1600 1131">
    <defs>
      <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1e40af"/>
        <stop offset="50%" stop-color="#3b82f6"/>
        <stop offset="100%" stop-color="#0ea5e9"/>
      </linearGradient>
      <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#f59e0b"/>
        <stop offset="100%" stop-color="#eab308"/>
      </linearGradient>
      <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc"/>
        <stop offset="100%" stop-color="#e2e8f0"/>
      </linearGradient>
      <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="4" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.15"/>
      </filter>
      <filter id="lightShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="2" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.1"/>
      </filter>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="url(#backgroundGradient)"/>
    
    <!-- Main certificate border -->
    <rect x="40" y="40" width="1520" height="1051" rx="25" fill="white" filter="url(#shadow)"/>
    <rect x="50" y="50" width="1500" height="1031" rx="20" fill="none" stroke="url(#primaryGradient)" stroke-width="6"/>
    <rect x="70" y="70" width="1460" height="991" rx="15" fill="none" stroke="url(#accentGradient)" stroke-width="3"/>
    
    <!-- Header section with academy branding -->
    <rect x="100" y="100" width="1400" height="180" rx="12" fill="url(#primaryGradient)" opacity="0.08"/>
    
    <!-- Academy logo/emblem placeholder -->
    <circle cx="220" cy="190" r="50" fill="url(#primaryGradient)" filter="url(#lightShadow)"/>
    <text x="220" y="185" text-anchor="middle" font-family="serif" font-size="20" font-weight="bold" fill="white">LAMB</text>
    <text x="220" y="205" text-anchor="middle" font-family="serif" font-size="12" font-weight="bold" fill="white">ACADEMY</text>
    
    <!-- Academy name -->
    <text x="300" y="140" font-family="serif" font-size="42" font-weight="bold" fill="#1e40af">LAGOS AVIATION MARITIME</text>
    <text x="300" y="185" font-family="serif" font-size="42" font-weight="bold" fill="#1e40af">BUSINESS ACADEMY</text>
    <text x="300" y="220" font-family="Arial" font-size="20" fill="#6b7280" font-style="italic">www.lambacademy.ng</text>
    <text x="300" y="245" font-family="Arial" font-size="16" fill="#9ca3af">Excellence in Professional Education</text>
    
    <!-- Decorative elements in header -->
    <circle cx="1350" cy="150" r="6" fill="url(#accentGradient)"/>
    <circle cx="1370" cy="170" r="4" fill="url(#accentGradient)" opacity="0.7"/>
    <circle cx="1330" cy="170" r="4" fill="url(#accentGradient)" opacity="0.7"/>
    
    <!-- Certificate title -->
    <text x="50%" y="380" text-anchor="middle" font-family="serif" font-size="68" font-weight="bold" fill="url(#primaryGradient)" filter="url(#shadow)">
      CERTIFICATE OF COMPLETION
    </text>
    
    <!-- Decorative line under title -->
    <line x1="300" y1="420" x2="1300" y2="420" stroke="url(#accentGradient)" stroke-width="4"/>
    <circle cx="800" cy="420" r="8" fill="url(#accentGradient)"/>
    
    <!-- Main content section -->
    <text x="50%" y="500" text-anchor="middle" font-family="serif" font-size="30" fill="#374151">
      This is to certify that
    </text>
    
    <!-- Student name with decorative background -->
    <rect x="250" y="530" width="1100" height="90" rx="15" fill="url(#primaryGradient)" opacity="0.05" stroke="url(#primaryGradient)" stroke-width="2"/>
    <text x="50%" y="590" text-anchor="middle" font-family="serif" font-size="52" font-weight="bold" fill="#1e40af" filter="url(#lightShadow)">
      ${student}
    </text>
    
    <text x="50%" y="670" text-anchor="middle" font-family="serif" font-size="26" fill="#374151">
      has successfully completed the comprehensive course requirements for
    </text>
    
    <!-- Course name with emphasis -->
    <rect x="200" y="700" width="1200" height="80" rx="12" fill="url(#accentGradient)" opacity="0.1"/>
    <text x="50%" y="750" text-anchor="middle" font-family="serif" font-size="40" font-weight="bold" fill="url(#primaryGradient)">
      ${course}
    </text>
    
    ${
      scoreText
        ? `
    <!-- Score display -->
    <text x="50%" y="810" text-anchor="middle" font-family="Arial" font-size="22" fill="#6b7280" font-weight="500">
      ${scoreText}
    </text>`
        : ''
    }
    
    <!-- Date and validation -->
    <text x="50%" y="880" text-anchor="middle" font-family="serif" font-size="24" fill="#374151">
      Awarded this ${date}
    </text>
    
    <!-- Footer section with academy seal -->
    <circle cx="1300" cy="950" r="70" fill="none" stroke="url(#primaryGradient)" stroke-width="4"/>
    <circle cx="1300" cy="950" r="50" fill="url(#primaryGradient)" opacity="0.1"/>
    <text x="1300" y="935" text-anchor="middle" font-family="serif" font-size="12" font-weight="bold" fill="#1e40af">LAGOS AVIATION</text>
    <text x="1300" y="950" text-anchor="middle" font-family="serif" font-size="12" font-weight="bold" fill="#1e40af">MARITIME</text>
    <text x="1300" y="965" text-anchor="middle" font-family="serif" font-size="12" font-weight="bold" fill="#1e40af">BUSINESS ACADEMY</text>
    <text x="1300" y="980" text-anchor="middle" font-family="serif" font-size="10" fill="#6b7280">OFFICIAL SEAL</text>
    
    <!-- Signature section -->
    <line x1="200" y1="980" x2="500" y2="980" stroke="#6b7280" stroke-width="2"/>
    <text x="350" y="1005" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">Director of Academic Affairs</text>
    
    <!-- Verification section -->
    <text x="200" y="1040" font-family="Arial" font-size="12" fill="#9ca3af">Certificate ID: LAMB-${Date.now()
      .toString()
      .slice(-8)}</text>
    <text x="200" y="1060" font-family="Arial" font-size="12" fill="#9ca3af">Verify at: www.lambacademy.ng/verify</text>
    
    <!-- Corner decorative elements -->
    <circle cx="120" cy="120" r="10" fill="url(#accentGradient)" opacity="0.6"/>
    <circle cx="1480" cy="120" r="10" fill="url(#accentGradient)" opacity="0.6"/>
    <circle cx="120" cy="1011" r="10" fill="url(#accentGradient)" opacity="0.6"/>
    <circle cx="1480" cy="1011" r="10" fill="url(#accentGradient)" opacity="0.6"/>
    
    <!-- Watermark -->
    <text x="50%" y="50%" text-anchor="middle" font-family="serif" font-size="120" fill="url(#primaryGradient)" opacity="0.03" transform="rotate(-45 800 565)">
      LAMBACADEMY
    </text>
  </svg>`;
}

async function uploadCertificateSVG(svg: string) {
  const file = new File([Buffer.from(svg)], `certificate-${Date.now()}.svg`, {
    type: 'image/svg+xml',
  });
  const res = await utapi.uploadFiles(file);
  if (!res?.data?.url) throw new Error('Certificate upload failed');
  return res.data.url; // public URL (utfs.io)
}

export async function updateCourseProgress(courseId: string, progress: number) {
  const user = await requireUserSafe();
  if (!user) return { success: false, error: 'Unauthorized' };

  const enrollment = await prisma.enrollment.findFirst({
    where: { userId: user.id, courseId },
    include: { course: true, user: true },
  });
  if (!enrollment) return { success: false, error: 'Not enrolled' };

  const completedAt = progress >= 100 ? new Date() : null;

  await prisma.enrollment.update({
    where: { id: enrollment.id },
    data: { progressPercent: progress, completedAt },
  });

  // Certificate logic
  const c = enrollment.course;
  if (progress >= 100 && c.certificateEnabled) {
    const scorePercent =
      enrollment.maxPossibleScore > 0
        ? Math.round(
            (enrollment.totalScore / enrollment.maxPossibleScore) * 100
          )
        : 0;

    const requireMin =
      c.certificateRequireMinScore && c.certificateMinScore != null;
    const meetsMin =
      !requireMin || scorePercent >= Math.round(c.certificateMinScore!);
    const requireCompletion = c.certificateRequireCompletion
      ? progress >= 100
      : true;

    if (requireCompletion && meetsMin) {
      // create if not exists
      const existing = await prisma.certificate.findFirst({
        where: { userId: user.id, courseId },
      });
      if (!existing) {
        const svg = buildCertificateSVG({
          student: enrollment.user.firstName + ' ' + enrollment.user.lastName,
          course: c.title,
          date: new Date().toLocaleDateString(),
          scoreText: c.certificateRequireMinScore
            ? `Final Score: ${scorePercent}%`
            : undefined,
        });
        const imageUrl = await uploadCertificateSVG(svg);
        await prisma.certificate.create({
          data: { userId: user.id, courseId, imageUrl },
        });
      }
    }
  }

  return { success: true };
}

// --- types/handlers used by your player (to silence TS errors) ---
export async function getQuizForLecture(lectureId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { lectureId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) return null;

  return {
    id: quiz.id,
    title: quiz.title,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      order: q.order,
      question: q.question,
      options: q.options,
    })),
  };
}

export async function submitQuizAttempt(lectureId: string, answers: number[]) {
  const user = await requireUserSafe();
  if (!user) return { success: false, error: 'Unauthorized' };

  const quiz = await prisma.quiz.findFirst({
    where: { lectureId },
    include: { questions: true },
  });
  if (!quiz) return { success: false, error: 'No quiz for lecture' };

  const maxScore = quiz.questions.length;
  let score = 0;
  quiz.questions.forEach((q, i) => {
    if (answers[i] === q.correct) score += 1;
  });

  await prisma.quizAttempt.create({
    data: {
      userId: user.id,
      quizId: quiz.id,
      answers,
      score,
      maxScore,
    },
  });

  // Update enrollment totals
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    select: { section: { select: { courseId: true } } },
  });
  if (lecture?.section?.courseId) {
    const enr = await prisma.enrollment.findFirst({
      where: { userId: user.id, courseId: lecture.section.courseId },
    });
    if (enr) {
      await prisma.enrollment.update({
        where: { id: enr.id },
        data: {
          totalScore: enr.totalScore + score,
          maxPossibleScore: enr.maxPossibleScore + maxScore,
        },
      });
    }
  }

  return { success: true as const, score, maxScore };
}

export async function getAssignmentMeta(lectureId: string) {
  const user = await requireUserSafe();
  if (!user) return null;

  const assignment = await prisma.assignment.findFirst({
    where: { lectureId },
  });
  if (!assignment) return null;

  const my = await prisma.submission.findFirst({
    where: { lectureId, userId: user.id },
    orderBy: { submittedAt: 'desc' },
  });

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    dueDate: assignment.dueDate,
    mySubmission: my
      ? {
          id: my.id,
          content: my.content,
          grade: my.grade,
          feedback: my.feedback,
          submittedAt: my.submittedAt.toISOString(),
        }
      : undefined,
  };
}

export async function submitAssignment(lectureId: string, content: string) {
  const user = await requireUserSafe();
  if (!user) return { success: false, error: 'Unauthorized' };

  const assignment = await prisma.assignment.findFirst({
    where: { lectureId },
  });
  if (!assignment) return { success: false, error: 'No assignment' };

  await prisma.submission.create({
    data: {
      userId: user.id,
      lectureId,
      assignmentId: assignment.id,
      content,
      attachments: [],
    },
  });

  return { success: true as const };
}

// Dashboard Stats
export async function getStudentDashboardStats() {
  const user = await checkAuth();

  const enrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, paymentStatus: 'COMPLETED' },
  });

  const totalEnrollments = enrollments.length;
  const completedCourses = enrollments.filter((e) => e.completedAt).length;
  const inProgressCourses = totalEnrollments - completedCourses;

  const totalCertificates = await prisma.certificate.count({
    where: { userId: user.id },
  });

  const averageProgress =
    totalEnrollments > 0
      ? enrollments.reduce((sum, e) => sum + e.progressPercent, 0) /
        totalEnrollments
      : 0;

  return {
    totalEnrollments,
    completedCourses,
    inProgressCourses,
    totalCertificates,
    averageProgress,
  };
}

// Available Courses
export async function getAvailableCourses() {
  const user = await checkAuth();

  const courses = await prisma.course.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { enrollments: true, sections: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const userEnrollments = await prisma.enrollment.findMany({
    where: { userId: user.id, paymentStatus: 'COMPLETED' },
    select: { courseId: true },
  });

  const enrolledCourseIds = new Set(userEnrollments.map((e) => e.courseId));

  return courses.map((course) => ({
    ...course,
    isEnrolled: enrolledCourseIds.has(course.id),
  }));
}

export async function getStudentEnrollments() {
  const user = await checkAuth();

  return await prisma.enrollment.findMany({
    where: {
      userId: user.id,
      paymentStatus: 'COMPLETED',
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          description: true,
          isPaid: true,
          price: true,
          certificateEnabled: true,
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });
}

// Course Enrollment
export async function enrollInFreeCourse(courseId: string) {
  const user = await checkAuth();

  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return { success: false, error: 'Course not found' };
    if (course.isPaid)
      return { success: false, error: 'This is a paid course' };

    const existing = await prisma.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });
    if (existing) return { success: false, error: 'Already enrolled' };

    await prisma.enrollment.create({
      data: { userId: user.id, courseId, paymentStatus: 'COMPLETED' },
    });

    revalidatePath('/dashboard');
    revalidatePath('/dashboard/browse');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to enroll in course' };
  }
}

// Course Details
export async function getStudentCourseDetails(courseId: string) {
  const user = await checkAuth();

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    // paymentStatus can't be used inside 'where' of a unique query, check separately if needed
  });

  if (!enrollment || enrollment.paymentStatus !== 'COMPLETED') {
    redirect('/dashboard');
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          lectures: { orderBy: { order: 'asc' } },
        },
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!course) redirect('/dashboard');

  return { course, enrollment };
}

// Certificates
export async function getStudentCertificates() {
  const user = await checkAuth();

  return prisma.certificate.findMany({
    where: { userId: user.id },
    include: { course: { select: { title: true, description: true } } },
    orderBy: { issuedAt: 'desc' },
  });
}

// Get user profile
export async function getUserProfile() {
  const user = await checkAuth();

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true, // full display name
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dateOfBirth: true,
      gender: true,
      department: true,
      course: true,
      address: true,
      state: true,
      country: true,
      role: true,
    },
  });

  if (!profile) throw new Error('User profile not found');
  return profile;
}

// Update user profile
export async function updateUserProfile(data: any) {
  const user = await checkAuth();

  // Optional: derive and normalize name if both first & last are provided
  const normalize = (s: string) =>
    s
      ?.replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (m) => m.toUpperCase());

  const firstName = data.firstName
    ? normalize(String(data.firstName))
    : undefined;
  const lastName = data.lastName ? normalize(String(data.lastName)) : undefined;
  const name =
    firstName && lastName ? normalize(`${lastName} ${firstName}`) : undefined; // surname first display

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(data.email ? { email: String(data.email).trim() } : {}),
        ...(data.phone ? { phone: String(data.phone).trim() } : {}),
        ...(data.gender ? { gender: data.gender } : {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
        ...(name ? { name } : {}),
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        department: data.department || null,
        course: data.course || null,
        address: data.address || null,
        state: data.state || null,
        country: data.country || null,
      },
    });

    revalidatePath('/dashboard/profile');
    return { success: true };
  } catch (err: any) {
    const msg =
      err?.code === 'P2002'
        ? 'Email already in use'
        : 'Failed to update profile';
    return { success: false, error: msg };
  }
}

// Change password
export async function changePassword(
  currentPassword: string,
  newPassword: string
) {
  const _ = await checkAuth(); // ensure signed-in
  try {
    const res = await auth.api.changePassword({
      headers: await headers(),
      body: { currentPassword, newPassword },
    });
    return { success: true };
  } catch (e: any) {
    // Fallback guidance if your Better Auth version doesn't support changePassword
    const msg = e?.message ?? 'Failed to change password';
    return { success: false, error: msg };
  }
}

// Delete user account
export async function deleteUserAccount() {
  const user = await checkAuth();

  try {
    // Sign out (clears cookies/session)
    try {
      await auth.api.signOut({ headers: await headers() });
    } catch {
      // non-fatal if already expired
    }

    // Clean up LMS data
    await prisma.quizAttempt.deleteMany({ where: { userId: user.id } });
    await prisma.submission.deleteMany({ where: { userId: user.id } });
    await prisma.certificate.deleteMany({ where: { userId: user.id } });
    await prisma.enrollment.deleteMany({ where: { userId: user.id } });

    // Delete the user (Sessions/Accounts should cascade if your schema has onDelete: Cascade)
    await prisma.user.delete({ where: { id: user.id } });

    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete account' };
  }
}
