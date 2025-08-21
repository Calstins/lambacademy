// components/student/course-player.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Play,
  CheckCircle,
  Lock,
  FileText,
  Video,
  HelpCircle,
  ClipboardList,
  Upload,
  ChevronRight,
  Award,
  CreditCard,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  updateCourseProgress,
  getQuizForLecture,
  submitQuizAttempt,
  getAssignmentMeta,
  submitAssignment,
} from '@/lib/actions/student';
import type {
  QuizDTO,
  AssignmentDTO,
  SubmitQuizResult,
} from '@/lib/actions/student';

interface Lecture {
  id: string;
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'PRACTICE_TEST' | 'ASSIGNMENT' | 'PDF';
  content: any;
  order: number;
}

interface Section {
  id: string;
  title: string;
  order: number;
  isPaid: boolean;
  price?: number;
  isLocked: boolean;
  lectures: Lecture[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  curriculum: string;
  sections: Section[];
}

interface Enrollment {
  id: string;
  progressPercent: number;
  enrolledAt: Date | string;
  completedAt?: string;
  paidSections: string[];
  totalScore: number;
  maxPossibleScore: number;
}

interface CoursePlayerProps {
  course: Course;
  enrollment: Enrollment;
  courseId: string;
}

const lectureIcons = {
  VIDEO: Video,
  TEXT: FileText,
  QUIZ: HelpCircle,
  PRACTICE_TEST: ClipboardList,
  ASSIGNMENT: ClipboardList,
  PDF: Upload,
};

export function CoursePlayer({
  course,
  enrollment,
  courseId,
}: CoursePlayerProps) {
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [completedLectures, setCompletedLectures] = useState<Set<string>>(
    new Set()
  );
  const [currentProgress, setCurrentProgress] = useState(
    enrollment.progressPercent
  );
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [sectionToPurchase, setSectionToPurchase] = useState<Section | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  // QUIZ / PRACTICE_TEST
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<QuizDTO | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
  } | null>(null);

  // ASSIGNMENT
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const [assignmentText, setAssignmentText] = useState('');

  // Find first available lecture
  React.useEffect(() => {
    for (const section of course.sections) {
      if (!section.isPaid || enrollment.paidSections.includes(section.id)) {
        if (section.lectures.length > 0) {
          setSelectedLecture(section.lectures[0]);
          setSelectedSection(section);
          break;
        }
      }
    }
  }, [course.sections, enrollment.paidSections]);

  React.useEffect(() => {
    setQuiz(null);
    setQuizResult(null);
    setAnswers([]);
    setAssignment(null);
    setAssignmentText('');

    if (!selectedLecture) return;

    if (
      selectedLecture.type === 'QUIZ' ||
      selectedLecture.type === 'PRACTICE_TEST'
    ) {
      setQuizLoading(true);
      getQuizForLecture(selectedLecture.id)
        .then((q: QuizDTO | null) => {
          setQuiz(q);
          if (q?.questions?.length)
            setAnswers(Array(q.questions.length).fill(-1));
        })
        .finally(() => setQuizLoading(false));
    }

    if (selectedLecture.type === 'ASSIGNMENT') {
      setAssignmentLoading(true);
      getAssignmentMeta(selectedLecture.id)
        .then((a: AssignmentDTO | null) => setAssignment(a))
        .finally(() => setAssignmentLoading(false));
    }
  }, [selectedLecture?.id, selectedLecture?.type]);

  // in components/student/course-player.tsx (top-level, client side)
  function toEmbedUrl(url: string) {
    try {
      const u = new URL(url);

      // YouTube
      if (
        u.hostname.includes('youtube.com') ||
        u.hostname.includes('youtu.be')
      ) {
        // youtu.be/<id>
        if (u.hostname === 'youtu.be') {
          const id = u.pathname.slice(1);
          return `https://www.youtube.com/embed/${id}`;
        }
        // youtube.com/watch?v=<id>
        const id = u.searchParams.get('v');
        if (id) return `https://www.youtube.com/embed/${id}`;
        // youtube.com/embed/<id> already fine
        if (u.pathname.startsWith('/embed/')) return url;
      }

      // Vimeo
      if (u.hostname.includes('vimeo.com')) {
        const id = u.pathname.split('/').filter(Boolean).pop();
        if (id) return `https://player.vimeo.com/video/${id}`;
      }

      // fallback: return the original (works if it’s already an embeddable URL)
      return url;
    } catch {
      return url;
    }
  }

  const onAnswer = (idx: number, optionIdx: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[idx] = optionIdx;
      return next;
    });
  };

  const onSubmitQuiz = async () => {
    if (!selectedLecture) return;
    if (!quiz) {
      toast.error('No quiz loaded');
      return;
    }
    if (quiz.questions.length === 0) {
      toast.error('This quiz has no questions yet.');
      return;
    }
    if (answers.some((a) => a < 0)) {
      toast.error('Answer all questions');
      return;
    }

    startTransition(async () => {
      const res = (await submitQuizAttempt(
        selectedLecture.id,
        answers
      )) as SubmitQuizResult;
      if (
        res.success &&
        typeof res.score === 'number' &&
        typeof res.maxScore === 'number'
      ) {
        setQuizResult({ score: res.score, maxScore: res.maxScore });
        toast.success(`Score: ${res.score}/${res.maxScore}`);
      } else {
        toast.error(res.error || 'Failed to submit quiz');
      }
    });
  };

  const onSubmitAssignment = async () => {
    if (!selectedLecture) return;
    if (!assignmentText.trim()) {
      toast.error('Please enter your answer');
      return;
    }
    startTransition(async () => {
      const res = await submitAssignment(
        selectedLecture.id,
        assignmentText.trim()
      );
      if (res.success) {
        toast.success('Assignment submitted!');
        // refresh my submission
        const a = await getAssignmentMeta(selectedLecture.id);
        setAssignment(a);
        setAssignmentText('');
      } else {
        toast.error(res.error || 'Failed to submit assignment');
      }
    });
  };

  const handleLectureSelect = (lecture: Lecture, section: Section) => {
    // Check if section is paid and not purchased
    if (section.isPaid && !enrollment.paidSections.includes(section.id)) {
      setSectionToPurchase(section);
      setShowPaymentDialog(true);
      return;
    }

    setSelectedLecture(lecture);
    setSelectedSection(section);
  };

  const handlePurchaseSection = async () => {
    if (!sectionToPurchase) return;

    startTransition(async () => {
      try {
        const response = await fetch('/api/payment/section/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sectionId: sectionToPurchase.id,
            courseId: courseId,
            amount: sectionToPurchase.price,
          }),
        });

        if (response.ok) {
          const { authorization_url } = await response.json();
          window.location.href = authorization_url;
        } else {
          toast.error('Failed to initialize payment');
        }
      } catch (error) {
        toast.error('Payment initialization failed');
      }
    });
  };

  const markLectureComplete = async (lectureId: string) => {
    const newCompleted = new Set(completedLectures);
    newCompleted.add(lectureId);
    setCompletedLectures(newCompleted);

    // Calculate new progress (only count accessible lectures)
    const accessibleLectures = course.sections
      .filter(
        (section) =>
          !section.isPaid || enrollment.paidSections.includes(section.id)
      )
      .reduce((sum, section) => sum + section.lectures.length, 0);

    const newProgress =
      accessibleLectures > 0
        ? (newCompleted.size / accessibleLectures) * 100
        : 0;

    startTransition(async () => {
      const result = await updateCourseProgress(courseId, newProgress);

      if (result.success) {
        setCurrentProgress(newProgress);

        if (newProgress >= 100) {
          toast.success(
            "🎉 Congratulations! You've completed the available course content!"
          );
        } else {
          toast.success('Lecture marked as complete!');
        }
      } else {
        toast.error(result.error || 'Failed to update progress');
        // Revert the state if update failed
        newCompleted.delete(lectureId);
        setCompletedLectures(new Set(newCompleted));
      }
    });
  };

  const renderLectureContent = () => {
    if (!selectedLecture) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-4" />
            <p>Select a lecture to start learning</p>
          </div>
        </div>
      );
    }

    switch (selectedLecture.type) {
      case 'VIDEO':
        return (
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {selectedLecture.content.videoUrl ? (
                <iframe
                  src={toEmbedUrl(selectedLecture.content.videoUrl)}
                  className="w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  Video not available
                </div>
              )}
            </div>
            {selectedLecture.content.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>{selectedLecture.content.description}</p>
              </div>
            )}
          </div>
        );

      case 'TEXT':
        return (
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap">
              {selectedLecture.content.textContent}
            </div>
          </div>
        );

      case 'PDF':
        return (
          <div className="space-y-4">
            {selectedLecture.content.pdfUrl ? (
              <>
                <div className="w-full h-[75vh] border rounded-lg overflow-hidden">
                  <iframe
                    src={`${selectedLecture.content.pdfUrl}#view=FitH&zoom=page-width`}
                    className="w-full h-full"
                    title={selectedLecture.content.fileName || 'PDF'}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={selectedLecture.content.pdfUrl}
                      download={
                        selectedLecture.content.fileName || 'document.pdf'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download PDF
                    </a>
                  </Button>
                  {selectedLecture.content.fileName && (
                    <span className="text-sm text-gray-600">
                      {selectedLecture.content.fileName}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                PDF not available.
              </div>
            )}

            {selectedLecture.content.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p>{selectedLecture.content.description}</p>
              </div>
            )}
          </div>
        );

      case 'QUIZ':
      case 'PRACTICE_TEST': {
        if (quizLoading) {
          return (
            <div className="text-center p-8 text-gray-500">
              {selectedLecture.type === 'QUIZ'
                ? 'Loading quiz…'
                : 'Loading practice test…'}
            </div>
          );
        }
        if (!quiz) {
          return (
            <div className="text-center p-8 text-gray-500">
              {selectedLecture.type === 'QUIZ'
                ? 'No quiz found for this lecture.'
                : 'No practice test found for this lecture.'}
            </div>
          );
        }
        const hasQuestions = quiz.questions.length > 0;
        if (!hasQuestions) {
          return (
            <div className="text-center p-8 text-gray-500">
              {selectedLecture.type === 'QUIZ'
                ? 'This quiz has no questions yet.'
                : 'This practice test has no questions yet.'}
            </div>
          );
        }

        return (
          <div className="space-y-6">
            {selectedLecture.content?.instructions && (
              <div className="p-4 bg-gray-50 rounded-lg text-sm">
                {selectedLecture.content.instructions}
              </div>
            )}

            <div className="space-y-5">
              {quiz.questions.map((q, i) => (
                <div key={q.id} className="rounded-lg border p-4">
                  <div className="font-medium mb-3">
                    {i + 1}. {q.question}
                  </div>
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => (
                      <label
                        key={oi}
                        className="flex items-center gap-2 text-sm cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[i] === oi}
                          onChange={() => onAnswer(i, oi)}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={onSubmitQuiz}
                disabled={isPending}
                className="bg-primary hover:bg-primary-800"
              >
                {isPending ? 'Submitting…' : 'Submit'}
              </Button>
              {quizResult && (
                <span className="text-sm text-gray-700">
                  Score: <b>{quizResult.score}</b> / {quizResult.maxScore}
                </span>
              )}
            </div>
          </div>
        );
      }

      case 'ASSIGNMENT': {
        if (assignmentLoading) {
          return (
            <div className="text-center p-8 text-gray-500">
              Loading assignment…
            </div>
          );
        }
        if (!assignment) {
          return (
            <div className="text-center p-8 text-gray-500">
              Assignment not available.
            </div>
          );
        }

        return (
          <div className="space-y-6">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold mb-2">{assignment.title}</div>
              <div className="whitespace-pre-wrap text-sm">
                {assignment.description}
              </div>
              {assignment.dueDate && (
                <div className="text-xs text-gray-600 mt-2">
                  Due: {new Date(assignment.dueDate).toLocaleString()}
                </div>
              )}
            </div>

            {assignment.mySubmission ? (
              <div className="rounded-lg border p-4 space-y-2">
                <div className="font-medium">Your latest submission</div>
                <div className="text-sm whitespace-pre-wrap">
                  {assignment.mySubmission.content}
                </div>
                <div className="text-xs text-gray-600">
                  Submitted:{' '}
                  {new Date(
                    assignment.mySubmission.submittedAt
                  ).toLocaleString()}
                </div>
                {(assignment.mySubmission.grade != null ||
                  assignment.mySubmission.feedback) && (
                  <div className="mt-2 rounded bg-green-50 p-2 text-sm">
                    {assignment.mySubmission.grade != null && (
                      <div>
                        Grade: <b>{assignment.mySubmission.grade}</b>
                      </div>
                    )}
                    {assignment.mySubmission.feedback && (
                      <div>Feedback: {assignment.mySubmission.feedback}</div>
                    )}
                  </div>
                )}
                <div className="pt-2 text-xs text-gray-500">
                  You can submit again to replace the previous one.
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="assignmentText" className="text-sm font-medium">
                Your answer
              </label>
              <textarea
                id="assignmentText"
                className="w-full rounded-md border p-3 text-sm"
                rows={8}
                placeholder="Type your answer here…"
                value={assignmentText}
                onChange={(e) => setAssignmentText(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <Button
                  onClick={onSubmitAssignment}
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-800"
                >
                  {isPending ? 'Submitting…' : 'Submit Assignment'}
                </Button>
              </div>
              {/* Optional: add an UploadThing dropzone for attachments and send their URLs to submitAssignment */}
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="text-center p-8 text-gray-500">
            Content type not supported yet.
          </div>
        );
    }
  };

  const isSectionAccessible = (section: Section) => {
    return !section.isPaid || enrollment.paidSections.includes(section.id);
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
        {/* Course Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{course.title}</CardTitle>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{currentProgress.toFixed(0)}%</span>
                </div>
                <Progress value={currentProgress} className="h-2" />
              </div>
              {enrollment.completedAt && (
                <Badge className="bg-green-100 text-green-800">
                  <Award className="w-3 h-3 mr-1" />
                  Completed
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {course.sections.map((section) => {
                const isAccessible = isSectionAccessible(section);

                return (
                  <div key={section.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm flex items-center">
                        {section.title}
                        {section.isPaid && !isAccessible && (
                          <Lock className="w-3 h-3 ml-2 text-amber-500" />
                        )}
                      </h4>
                      {section.isPaid && (
                        <Badge variant="outline" className="text-xs">
                          {isAccessible ? 'Purchased' : `₦${section.price}`}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1">
                      {section.lectures.map((lecture) => {
                        const Icon = lectureIcons[lecture.type];
                        const isCompleted = completedLectures.has(lecture.id);
                        const isSelected = selectedLecture?.id === lecture.id;

                        return (
                          <button
                            key={lecture.id}
                            onClick={() =>
                              handleLectureSelect(lecture, section)
                            }
                            disabled={!isAccessible}
                            className={`w-full flex items-center space-x-2 p-2 rounded text-left text-sm transition-colors ${
                              !isAccessible
                                ? 'opacity-50 cursor-not-allowed bg-gray-100'
                                : isSelected
                                ? 'bg-primary text-white'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1 truncate">
                              {lecture.title}
                            </span>
                            {!isAccessible && (
                              <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            )}
                            {isCompleted && isAccessible && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                            {isSelected && isAccessible && (
                              <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {!isAccessible && (
                        <Button
                          onClick={() => {
                            setSectionToPurchase(section);
                            setShowPaymentDialog(true);
                          }}
                          size="sm"
                          className="w-full bg-amber-600 hover:bg-amber-700"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Purchase Section
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {selectedLecture?.title || 'Course Content'}
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    {selectedLecture && (
                      <>
                        {React.createElement(
                          lectureIcons[selectedLecture.type],
                          {
                            className: 'w-4 h-4 text-gray-500',
                          }
                        )}
                        <span className="text-sm text-gray-500 capitalize">
                          {selectedLecture.type.toLowerCase().replace('_', ' ')}
                        </span>
                        {selectedSection?.isPaid && (
                          <Badge variant="outline" className="text-xs">
                            Premium Content
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {selectedLecture &&
                  selectedSection &&
                  isSectionAccessible(selectedSection) &&
                  !completedLectures.has(selectedLecture.id) && (
                    <Button
                      onClick={() => markLectureComplete(selectedLecture.id)}
                      disabled={isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {isPending ? 'Marking...' : 'Mark Complete'}
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent>{renderLectureContent()}</CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Purchase Section Access
            </DialogTitle>
            <DialogDescription>
              This section requires a separate purchase to access the content.
            </DialogDescription>
          </DialogHeader>

          {sectionToPurchase && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{sectionToPurchase.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {sectionToPurchase.lectures.length} lecture(s) included
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-primary">
                    ₦{sectionToPurchase.price?.toLocaleString()}
                  </span>
                  <Badge variant="outline">Premium Section</Badge>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  This is a one-time purchase. Once completed, you&apos;ll have
                  permanent access to this section&apos;s content.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchaseSection}
              disabled={isPending}
              className="bg-primary hover:bg-primary-800"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isPending
                ? 'Processing...'
                : `Pay ₦${sectionToPurchase?.price?.toLocaleString()}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
