// app/admin/courses/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
import { CourseCard } from '@/components/admin/course-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getCourses } from '@/lib/actions/admin';

export default async function AdminCoursesPage() {
  const courses = await getCourses();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Course Management
            </h1>
            <p className="text-gray-600 mt-2">
              Create and manage your courses, sections, and lectures.
            </p>
          </div>
          <Link href="/admin/courses/new">
            <Button className="bg-primary hover:bg-primary-800">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500 mb-4">
                <BookOpen className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No courses created yet</h3>
                <p className="text-sm">
                  Get started by creating your first course.
                </p>
              </div>
              <Link href="/admin/courses/new">
                <Button className="bg-primary hover:bg-primary-800">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {courses.map((course: any) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
