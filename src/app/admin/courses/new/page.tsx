// app/admin/courses/new/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
import { CourseCreationForm } from '@/components/admin/course-creation-form';

export default function CreateCoursePage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Create New Course</h1>
          <p className="text-gray-600 mt-2">
            Set up a new course with all the necessary details and curriculum.
          </p>
        </div>
        <CourseCreationForm />
      </div>
    </AdminLayout>
  );
}
