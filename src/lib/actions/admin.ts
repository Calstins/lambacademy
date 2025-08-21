// lib/actions/admin.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

type AdminQuizPayload = {
  title?: string;
  questions: Array<{
    question: string;
    options: string[];
    correct: number;
    order: number;
  }>;
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

// Helper function to check admin authorization
async function checkAdminAuth() {
  const user = await requireAdminSafe();
  if (!user) {
    redirect('/login');
  }
  return user;
}

// Dashboard Stats
export async function getDashboardStats() {
  await checkAdminAuth();

  const [totalCourses, totalUsers, totalEnrollments, enrollments] =
    await Promise.all([
      prisma.course.count(),
      prisma.user.count(),
      prisma.enrollment.count(),
      prisma.enrollment.findMany({
        include: { course: { select: { price: true, isPaid: true } } },
      }),
    ]);

  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });

  const totalRevenue = enrollments.reduce((sum, enrollment) => {
    if (enrollment.course.isPaid && enrollment.paymentStatus === 'COMPLETED') {
      return sum + (enrollment.course.price || 0);
    }
    return sum;
  }, 0);

  const completedEnrollments = await prisma.enrollment.count({
    where: { completedAt: { not: null } },
  });

  const completionRate =
    totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0;

  return {
    totalCourses,
    totalUsers,
    totalStudents,
    totalAdmins,
    totalEnrollments,
    totalRevenue,
    completionRate,
  };
}

export async function getCourses() {
  await checkAdminAuth();

  return await prisma.course.findMany({
    include: {
      sections: {
        include: {
          _count: {
            select: { lectures: true },
          },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getCourse(courseId: string) {
  await checkAdminAuth();

  return await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: { enrollments: true, sections: true },
      },
    },
  });
}
export async function deleteCourse(courseId: string) {
  await checkAdminAuth();

  try {
    await prisma.course.delete({
      where: { id: courseId },
    });

    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete course' };
  }
}

export async function toggleCourseStatus(courseId: string, isActive: boolean) {
  await checkAdminAuth();

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: { isActive: !isActive },
    });

    revalidatePath('/admin/courses');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update course status' };
  }
}

// Section Actions
export async function getSections(courseId: string) {
  await checkAdminAuth();

  return await prisma.section.findMany({
    where: { courseId },
    include: {
      _count: {
        select: { lectures: true },
      },
    },
    orderBy: { order: 'asc' },
  });
}

export async function createSection(courseId: string, formData: FormData) {
  await checkAdminAuth();

  const title = formData.get('title') as string;
  const isPaid = formData.get('isPaid') === 'true';
  const price = isPaid ? parseFloat(formData.get('price') as string) : null;

  // Get the next order number
  const lastSection = await prisma.section.findFirst({
    where: { courseId },
    orderBy: { order: 'desc' },
  });

  const order = (lastSection?.order || 0) + 1;

  try {
    const section = await prisma.section.create({
      data: {
        title,
        order,
        isPaid,
        price,
        courseId,
      },
    });

    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true, sectionId: section.id };
  } catch (error) {
    return { success: false, error: 'Failed to create section' };
  }
}

export async function updateSection(sectionId: string, formData: FormData) {
  await checkAdminAuth();

  const title = formData.get('title') as string;
  const isPaid = formData.get('isPaid') === 'true';
  const price = isPaid ? parseFloat(formData.get('price') as string) : null;

  try {
    const section = await prisma.section.update({
      where: { id: sectionId },
      data: {
        title,
        isPaid,
        price,
      },
    });

    revalidatePath(`/admin/courses/${section.courseId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update section' };
  }
}

export async function deleteSection(sectionId: string) {
  await checkAdminAuth();

  try {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { courseId: true },
    });

    await prisma.section.delete({
      where: { id: sectionId },
    });

    if (section) {
      revalidatePath(`/admin/courses/${section.courseId}`);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete section' };
  }
}

export async function reorderSections(
  sections: { id: string; order: number }[]
) {
  await checkAdminAuth();

  try {
    await Promise.all(
      sections.map((section) =>
        prisma.section.update({
          where: { id: section.id },
          data: { order: section.order },
        })
      )
    );

    // Get courseId for revalidation
    const firstSection = await prisma.section.findUnique({
      where: { id: sections[0].id },
      select: { courseId: true },
    });

    if (firstSection) {
      revalidatePath(`/admin/courses/${firstSection.courseId}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to reorder sections' };
  }
}

// Lecture Actions
export async function getLectures(sectionId: string) {
  await checkAdminAuth();

  return await prisma.lecture.findMany({
    where: { sectionId },
    orderBy: { order: 'asc' },
  });
}

export async function deleteLecture(lectureId: string) {
  await checkAdminAuth();

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      include: {
        section: {
          select: { courseId: true },
        },
      },
    });

    await prisma.lecture.delete({
      where: { id: lectureId },
    });

    if (lecture) {
      revalidatePath(`/admin/courses/${lecture.section.courseId}`);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete lecture' };
  }
}

// User Actions
export async function getUsers() {
  await checkAdminAuth();

  return await prisma.user.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function createUser(formData: FormData) {
  await checkAdminAuth();

  const h = await headers();
  const get = (k: string) => {
    const v = formData.get(k);
    return v === null || v === '' ? undefined : String(v).trim();
  };

  // accept either a single "name" (surname first) or fallback to first/last if your admin form still has them
  const rawName =
    get('name') ||
    [get('lastName'), get('firstName')].filter(Boolean).join(' ').trim();

  if (!rawName) {
    return { success: false, error: 'Full name is required (surname first).' };
  }

  const parts = rawName.split(/\s+/);
  if (parts.length < 2) {
    return {
      success: false,
      error:
        'Enter surname first, then at least one other name (e.g., "Okafor Caleb").',
    };
  }

  const surname = parts[0]; // lastName
  const givenNames = parts.slice(1).join(' '); // firstName

  const email = get('email');
  const password = get('password');
  const phone = get('phone');
  const role = get('role') as 'ADMIN' | 'STUDENT' | undefined;
  const gender = get('gender') as 'MALE' | 'FEMALE' | undefined;

  // optional extras
  const department = get('department');
  const course = get('course');
  const country = get('country');
  const dateOfBirthStr = get('dateOfBirth');
  const dateOfBirth = dateOfBirthStr ? new Date(dateOfBirthStr) : undefined;

  if (!email || !password || !phone || !gender) {
    return { success: false, error: 'Missing required fields.' };
  }

  try {
    const res = await auth.api.signUpEmail({
      headers: h,
      body: {
        // Better Auth core fields
        name: `${surname} ${givenNames}`,
        email,
        password,

        // additionalFields (must match your betterAuth user.additionalFields)
        firstName: givenNames,
        lastName: surname,
        phone,
        gender,
        department,
        course,
        country,
        dateOfBirth,
        role: role ?? 'STUDENT',
      },
    });

    // success: Better Auth returns an object with .user
    const userId = (res as any)?.user?.id;
    if (userId) {
      // keep your existing cache revalidation
      revalidatePath('/admin/users');
      return { success: true, userId };
    }

    const err =
      (res as any)?.error?.message ||
      (res as any)?.message ||
      'Failed to create user';
    return { success: false, error: err };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Failed to create user' };
  }
}

export async function updateUser(userId: string, formData: FormData) {
  await checkAdminAuth();

  const get = (k: string) => {
    const v = formData.get(k);
    return v === null || v === '' ? undefined : String(v).trim();
  };

  // Optional password field from the form:
  const password = get('password');
  if (password) {
    return {
      success: false,
      error:
        'Admin password change is disabled here. Use the password reset flow instead.',
    };
  }

  // Name handling (surname first)
  const rawName =
    get('name') ||
    [get('lastName'), get('firstName')].filter(Boolean).join(' ').trim();

  let firstName: string | undefined;
  let lastName: string | undefined;
  let name: string | undefined;

  if (rawName) {
    const parts = rawName.split(/\s+/);
    if (parts.length < 2) {
      return {
        success: false,
        error:
          'Enter surname first, then at least one other name (e.g., "Okafor Caleb").',
      };
    }
    lastName = parts[0];
    firstName = parts.slice(1).join(' ');

    const normalize = (s: string) =>
      s
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/\b\w/g, (m) => m.toUpperCase()); // simple Title Case

    name = normalize(`${lastName} ${firstName}`);
    firstName = normalize(firstName);
    lastName = normalize(lastName);
  }

  const email = get('email');
  const phone = get('phone');
  const role = get('role') as 'ADMIN' | 'STUDENT' | undefined;
  const gender = get('gender') as 'MALE' | 'FEMALE' | undefined;
  const department = get('department');
  const course = get('course');
  const country = get('country');
  const state = get('state');
  const address = get('address');
  const dobStr = get('dateOfBirth');
  const dateOfBirth = dobStr ? new Date(dobStr) : undefined;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(role ? { role } : {}),
        ...(gender ? { gender } : {}),
        department: department ?? null,
        course: course ?? null,
        country: country ?? null,
        state: state ?? null,
        address: address ?? null,
        ...(dateOfBirth ? { dateOfBirth } : {}),
        ...(name ? { name } : {}),
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
      },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    // If email unique constraint fails etc., surface a friendly message
    const msg =
      error?.code === 'P2002'
        ? 'Email already in use'
        : 'Failed to update user';
    return { success: false, error: msg };
  }
}

export async function deleteUser(userId: string) {
  await checkAdminAuth();

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    revalidatePath('/admin/users');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to delete user' };
  }
}

export async function getUserDetails(userId: string) {
  await checkAdminAuth();

  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: {
        include: {
          course: {
            select: { title: true },
          },
        },
      },
    },
  });
}

export async function createCourse(formData: FormData) {
  await checkAdminAuth();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const curriculum = formData.get('curriculum') as string;
  const isPaid = formData.get('isPaid') === 'true';
  const price = isPaid ? parseFloat(formData.get('price') as string) : null;
  const learningObjectives = JSON.parse(
    formData.get('learningObjectives') as string
  );

  // Certificate settings
  const certificateEnabled = formData.get('certificateEnabled') === 'true';
  const certificateRequireCompletion =
    formData.get('certificateRequireCompletion') === 'true';
  const certificateRequireMinScore =
    formData.get('certificateRequireMinScore') === 'true';
  const certificateMinScore = certificateRequireMinScore
    ? parseFloat(formData.get('certificateMinScore') as string)
    : null;

  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        learningObjectives,
        curriculum,
        isPaid,
        price,
        certificateEnabled,
        certificateRequireCompletion,
        certificateRequireMinScore,
        certificateMinScore,
      },
    });

    revalidatePath('/admin/courses');
    return { success: true, courseId: course.id };
  } catch (error) {
    return { success: false, error: 'Failed to create course' };
  }
}

export async function updateCourse(courseId: string, formData: FormData) {
  await checkAdminAuth();

  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const curriculum = formData.get('curriculum') as string;
  const isPaid = formData.get('isPaid') === 'true';
  const price = isPaid ? parseFloat(formData.get('price') as string) : null;
  const isActive = formData.get('isActive') === 'true';
  const learningObjectives = JSON.parse(
    formData.get('learningObjectives') as string
  );

  // Certificate settings
  const certificateEnabled = formData.get('certificateEnabled') === 'true';
  const certificateRequireCompletion =
    formData.get('certificateRequireCompletion') === 'true';
  const certificateRequireMinScore =
    formData.get('certificateRequireMinScore') === 'true';
  const certificateMinScore = certificateRequireMinScore
    ? parseFloat(formData.get('certificateMinScore') as string)
    : null;

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        learningObjectives,
        curriculum,
        isPaid,
        price,
        isActive,
        certificateEnabled,
        certificateRequireCompletion,
        certificateRequireMinScore,
        certificateMinScore,
      },
    });

    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${courseId}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Failed to update course' };
  }
}

// Certificate generation function
export async function generateCertificate(userId: string, courseId: string) {
  await checkAdminAuth();

  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
      include: {
        course: true,
        user: true,
      },
    });

    if (!enrollment) {
      return { success: false, error: 'Enrollment not found' };
    }

    const course = enrollment.course;

    // Check certificate requirements
    if (!course.certificateEnabled) {
      return {
        success: false,
        error: 'Certificates not enabled for this course',
      };
    }

    if (
      course.certificateRequireCompletion &&
      enrollment.progressPercent < 100
    ) {
      return {
        success: false,
        error: 'Course completion required for certificate',
      };
    }

    if (course.certificateRequireMinScore && enrollment.maxPossibleScore > 0) {
      const scorePercentage =
        (enrollment.totalScore / enrollment.maxPossibleScore) * 100;
      if (scorePercentage < (course.certificateMinScore || 70)) {
        return {
          success: false,
          error: `Minimum score of ${course.certificateMinScore}% required`,
        };
      }
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certificate.findUnique({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    if (existingCertificate) {
      return { success: false, error: 'Certificate already exists' };
    }

    // Generate certificate (placeholder - you'd integrate with a certificate generation service)
    const certificateUrl = `/certificates/default.png`; // Replace with actual generation

    await prisma.certificate.create({
      data: {
        userId: userId,
        courseId: courseId,
        imageUrl: certificateUrl,
      },
    });

    revalidatePath('/admin/certificates');
    return { success: true, certificateUrl };
  } catch (error) {
    return { success: false, error: 'Failed to generate certificate' };
  }
}

export async function ensureQuizForLecture(lectureId: string) {
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lecture) throw new Error('Lecture not found');

  let quiz = await prisma.quiz.findFirst({ where: { lectureId } });
  if (!quiz) {
    quiz = await prisma.quiz.create({
      data: { lectureId, title: lecture.title },
    });
  }
  return quiz;
}

// Create or update an Assignment row to mirror lecture.content (ASSIGNMENT)
export async function ensureOrUpdateAssignmentForLecture(lectureId: string) {
  const lecture = await prisma.lecture.findUnique({ where: { id: lectureId } });
  if (!lecture) throw new Error('Lecture not found');

  const content: any = lecture.content || {};
  const due = content?.dueDate ? new Date(content.dueDate) : null;

  const existing = await prisma.assignment.findFirst({ where: { lectureId } });
  if (existing) {
    await prisma.assignment.update({
      where: { id: existing.id },
      data: {
        title: lecture.title,
        description: content?.description || '',
        dueDate: due,
      },
    });
    return existing.id;
  }

  const created = await prisma.assignment.create({
    data: {
      title: lecture.title,
      description: content?.description || '',
      dueDate: due,
      lectureId,
    },
  });
  return created.id;
}

// --- EXPORT THESE FOR THE ADMIN UI ---

// Get quiz + questions for an admin editor
export async function getQuizAdmin(lectureId: string) {
  await checkAdminAuth();
  const quiz = await prisma.quiz.findFirst({
    where: { lectureId },
    include: { questions: { orderBy: { order: 'asc' } } },
  });
  if (!quiz) {
    // auto-provision so the UI has something to edit
    const created = await ensureQuizForLecture(lectureId);
    return {
      success: true,
      quiz: { id: created.id, title: created.title, questions: [] as any[] },
    };
  }
  return { success: true, quiz };
}

// Replace all questions (simple/robust upsert)
export async function saveQuizAdmin(
  lectureId: string,
  payload: AdminQuizPayload
) {
  await checkAdminAuth();
  const quiz = await ensureQuizForLecture(lectureId);

  if (payload.title && payload.title.trim()) {
    await prisma.quiz.update({
      where: { id: quiz.id },
      data: { title: payload.title.trim() },
    });
  }

  // nuke & replace for simplicity
  await prisma.question.deleteMany({ where: { quizId: quiz.id } });

  if (payload.questions?.length) {
    await prisma.question.createMany({
      data: payload.questions
        .sort((a, b) => a.order - b.order)
        .map((q) => ({
          quizId: quiz.id,
          question: q.question,
          options: q.options,
          correct: q.correct,
          order: q.order,
        })),
    });
  }

  return { success: true, quizId: quiz.id };
}

export async function createLecture(sectionId: string, formData: FormData) {
  await checkAdminAuth();
  const title = formData.get('title') as string;
  const type = formData.get('type') as any;
  const content = JSON.parse(formData.get('content') as string);

  const lastLecture = await prisma.lecture.findFirst({
    where: { sectionId },
    orderBy: { order: 'desc' },
  });
  const order = (lastLecture?.order || 0) + 1;

  try {
    const lecture = await prisma.lecture.create({
      data: { title, order, type, content, sectionId },
    });

    // 🔐 Provision backing records so student runner never says "not configured"
    if (type === 'QUIZ' || type === 'PRACTICE_TEST') {
      await ensureQuizForLecture(lecture.id);
    }
    if (type === 'ASSIGNMENT') {
      await ensureOrUpdateAssignmentForLecture(lecture.id);
    }

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { courseId: true },
    });
    if (section) revalidatePath(`/admin/courses/${section.courseId}`);

    return { success: true, lectureId: lecture.id };
  } catch {
    return { success: false, error: 'Failed to create lecture' };
  }
}

export async function updateLecture(lectureId: string, formData: FormData) {
  await checkAdminAuth();
  const title = formData.get('title') as string;
  const type = formData.get('type') as any;
  const content = JSON.parse(formData.get('content') as string);

  try {
    const lecture = await prisma.lecture.update({
      where: { id: lectureId },
      data: { title, type, content },
      include: { section: { select: { courseId: true } } },
    });

    // 🔐 Keep backing records in sync
    if (type === 'QUIZ' || type === 'PRACTICE_TEST') {
      await ensureQuizForLecture(lectureId);
    }
    if (type === 'ASSIGNMENT') {
      await ensureOrUpdateAssignmentForLecture(lectureId);
    }

    revalidatePath(`/admin/courses/${lecture.section.courseId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to update lecture' };
  }
}
