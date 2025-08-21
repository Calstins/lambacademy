// app/admin/courses/[courseId]/edit/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
import { EditCourseForm } from '@/components/admin/edit-course-form';
import { getCourse } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';

interface EditCoursePageProps {
  params: {
    courseId: string;
  };
}

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const course = await getCourse(params.courseId);

  if (!course) {
    redirect('/admin/courses');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Edit Course</h1>
          <p className="text-gray-600 mt-2">
            Update course details and settings.
          </p>
        </div>
        <EditCourseForm
          course={{ ...course, price: course.price ?? undefined }}
          courseId={params.courseId}
        />
      </div>
    </AdminLayout>
  );
}
