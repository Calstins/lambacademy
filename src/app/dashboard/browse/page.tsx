// app/dashboard/browse/page.tsx
import { StudentLayout } from '@/components/student/student-layout';
import { CourseGrid } from '@/components/student/course-grid';
import { getAvailableCourses } from '@/lib/actions/student';

export default async function BrowseCoursesPage() {
  const rawCourses = await getAvailableCourses();
  const courses = rawCourses.map((course: any) => ({
    ...course,
    sections: course.sections ?? [],
  }));

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Browse Courses</h1>
          <p className="text-gray-600 mt-2">
            Discover new courses and expand your knowledge.
          </p>
        </div>

        <CourseGrid courses={courses} />
      </div>
    </StudentLayout>
  );
}
