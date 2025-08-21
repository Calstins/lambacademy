// lib/actions/admin-quiz.ts
'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireAdminSafe } from '../auth-helpers';

type LectureType = 'QUIZ' | 'PRACTICE_TEST';

export type EditorQuizDTO = {
  id: string;
  title: string;
  questions: {
    id: string;
    order: number;
    question: string;
    options: string[];
    correct: number;
  }[];
};

export type EditorLoadDTO = {
  lecture: {
    id: string;
    title: string;
    type: LectureType;
  };
  quiz: EditorQuizDTO | null;
};

export async function getQuizEditorData(
  lectureId: string
): Promise<EditorLoadDTO> {
  const admin = await requireAdminSafe();

  if (!admin) {
    return {
      lecture: { id: lectureId, title: 'Restricted', type: 'QUIZ' as const },
      quiz: null,
    };
  }

  try {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
      select: { id: true, title: true, type: true },
    });
    if (!lecture)
      return {
        lecture: { id: lectureId, title: 'Not found', type: 'QUIZ' as const },
        quiz: null,
      };

    const quiz = await prisma.quiz.findFirst({
      where: { lectureId },
      include: { questions: { orderBy: { order: 'asc' } } },
    });

    return {
      lecture: {
        id: lecture.id,
        title: lecture.title,
        type: lecture.type as 'QUIZ' | 'PRACTICE_TEST',
      },
      quiz: quiz
        ? {
            id: quiz.id,
            title: quiz.title,
            questions: quiz.questions.map((q) => ({
              id: q.id,
              order: q.order,
              question: q.question,
              options: q.options,
              correct: q.correct,
            })),
          }
        : null,
    };
  } catch {
    // last-resort fallback
    return {
      lecture: { id: lectureId, title: 'Unavailable', type: 'QUIZ' as const },
      quiz: null,
    };
  }
}

export async function upsertQuizTitle(
  lectureId: string,
  title: string
): Promise<{ success: boolean; quizId?: string; error?: string }> {
  const admin = await requireAdminSafe();
  if (!admin) return { success: false, error: 'Unauthorized' };
  if (!title.trim()) return { success: false, error: 'Title is required' };

  let quiz = await prisma.quiz.findFirst({ where: { lectureId } });
  if (!quiz) {
    quiz = await prisma.quiz.create({ data: { title, lectureId } });
  } else {
    quiz = await prisma.quiz.update({
      where: { id: quiz.id },
      data: { title },
    });
  }

  revalidatePath('/admin'); // or a more specific path if you have one
  return { success: true, quizId: quiz.id };
}

export async function addQuestion(
  lectureId: string,
  payload: {
    question: string;
    options: string[];
    correct: number;
  }
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdminSafe();
  if (!admin) return { success: false, error: 'Unauthorized' };

  const { question, options, correct } = payload;

  if (!question.trim()) return { success: false, error: 'Question required' };
  const opts = (options || []).map((o) => o.trim()).filter(Boolean);
  if (opts.length < 2) return { success: false, error: 'At least 2 options' };
  if (correct < 0 || correct >= opts.length)
    return { success: false, error: 'Correct index out of range' };

  let quiz = await prisma.quiz.findFirst({ where: { lectureId } });
  if (!quiz) {
    const lecture = await prisma.lecture.findUnique({
      where: { id: lectureId },
    });
    if (!lecture) return { success: false, error: 'Lecture not found' };
    quiz = await prisma.quiz.create({
      data: { title: lecture.title, lectureId },
    });
  }

  const last = await prisma.question.findFirst({
    where: { quizId: quiz.id },
    orderBy: { order: 'desc' },
  });
  const order = (last?.order ?? 0) + 1;

  await prisma.question.create({
    data: {
      question,
      options: opts,
      correct,
      order,
      quizId: quiz.id,
    },
  });

  revalidatePath('/admin');
  return { success: true };
}

export async function updateQuestion(
  questionId: string,
  payload: Partial<{ question: string; options: string[]; correct: number }>
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdminSafe();
  if (!admin) return { success: false, error: 'Unauthorized' };

  const data: any = {};
  if (typeof payload.question === 'string') {
    if (!payload.question.trim())
      return { success: false, error: 'Question required' };
    data.question = payload.question.trim();
  }
  if (payload.options) {
    const opts = payload.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) return { success: false, error: 'At least 2 options' };
    data.options = opts;

    if (typeof payload.correct === 'number') {
      if (payload.correct < 0 || payload.correct >= opts.length)
        return { success: false, error: 'Correct index out of range' };
      data.correct = payload.correct;
    }
  } else if (typeof payload.correct === 'number') {
    // need current options length to validate
    const current = await prisma.question.findUnique({
      where: { id: questionId },
      select: { options: true },
    });
    if (!current) return { success: false, error: 'Question not found' };
    if (payload.correct < 0 || payload.correct >= current.options.length)
      return { success: false, error: 'Correct index out of range' };
    data.correct = payload.correct;
  }

  await prisma.question.update({ where: { id: questionId }, data });
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteQuestion(
  questionId: string
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdminSafe();
  if (!admin) return { success: false, error: 'Unauthorized' };
  await prisma.question.delete({ where: { id: questionId } });
  revalidatePath('/admin');
  return { success: true };
}

export async function reorderQuestions(
  quizId: string,
  items: { id: string; order: number }[]
): Promise<{ success: boolean; error?: string }> {
  const admin = await requireAdminSafe();
  if (!admin) return { success: false, error: 'Unauthorized' };

  await Promise.all(
    items.map(({ id, order }) =>
      prisma.question.update({ where: { id }, data: { order } })
    )
  );

  revalidatePath('/admin');
  return { success: true };
}
