import { StudentLayout } from '@/components/student/student-layout';
import { CoursePlayer } from '@/components/student/course-player';
import { getStudentCourseDetails } from '@/lib/actions/student';
import { redirect } from 'next/navigation';

interface CourseDetailPageProps {
  params: {
    courseId: string;
  };
}

export default async function StudentCourseDetailPage({
  params,
}: CourseDetailPageProps) {
  try {
    const { course, enrollment } = await getStudentCourseDetails(
      params.courseId
    );

    // Ensure all section.price are undefined instead of null
    const fixedCourse = {
      ...course,
      sections: course.sections?.map((section: any) => ({
        ...section,
        price: section.price === null ? undefined : section.price,
      })),
    };

    // Convert enrollment.completedAt from Date | null to string | undefined
    const fixedEnrollment = {
      ...enrollment,
      completedAt: enrollment.completedAt
        ? enrollment.completedAt.toISOString()
        : undefined,
    };

    return (
      <StudentLayout>
        <CoursePlayer
          course={fixedCourse}
          enrollment={fixedEnrollment}
          courseId={params.courseId}
        />
      </StudentLayout>
    );
  } catch (error) {
    redirect('/dashboard');
  }
}
