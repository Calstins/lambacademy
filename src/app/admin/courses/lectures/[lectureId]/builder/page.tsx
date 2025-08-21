import QuizBuilder from '@/components/admin/quiz-builder';

export default function Page({ params }: { params: { lectureId: string } }) {
  return (
    <div className="p-6">
      <QuizBuilder lectureId={params.lectureId} lectureType="QUIZ" />
    </div>
  );
}
