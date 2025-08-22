import QuizBuilder from '@/components/admin/quiz-builder';

export default async function Page({
  params,
}: {
  params: Promise<{ lectureId: string }>;
}) {
  const { lectureId } = await params;

  return (
    <div className="p-6">
      <QuizBuilder lectureId={lectureId} lectureType="QUIZ" />
    </div>
  );
}
