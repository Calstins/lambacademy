// app/admin/courses/[courseId]/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
import { SectionManagement } from '@/components/admin/section-management';
import { LectureManagement } from '@/components/admin/lecture-management';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Users, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { getCourse, getSections } from '@/lib/actions/admin';
import { redirect } from 'next/navigation';
import { SectionSelector } from '@/components/admin/section-selector';

interface CourseDetailPageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseDetailPage({
  params,
}: CourseDetailPageProps) {
  const [course, sections] = await Promise.all([
    getCourse(params.courseId),
    getSections(params.courseId),
  ]);

  if (!course) {
    redirect('/admin/courses');
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Course Header */}
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h1 className="text-3xl font-bold text-primary">
                {course.title}
              </h1>
              <Badge variant={course.isActive ? 'default' : 'secondary'}>
                {course.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {course.isPaid && (
                <Badge variant="outline" className="bg-accent text-primary">
                  ₦{course.price}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 mb-4">{course.description}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {course._count.enrollments} enrolled
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                {course._count.sections} sections
              </div>
            </div>
          </div>

          <Link href={`/admin/courses/${params.courseId}/edit`}>
            <Button className="bg-primary hover:bg-primary-800">
              <Edit className="w-4 h-4 mr-2" />
              Edit Course
            </Button>
          </Link>
        </div>

        {/* Course Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Learning Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2">
                {course.learningObjectives.map(
                  (objective: string, index: number) => (
                    <li key={index} className="text-gray-700">
                      {objective}
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Curriculum Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">
                {course.curriculum}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Section Management */}
        <SectionManagement courseId={params.courseId} />

        {/* Lecture Management */}
        {sections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Manage Lectures</CardTitle>
            </CardHeader>
            <CardContent>
              <SectionSelector
                sections={sections.map((section) => ({
                  ...section,
                  price: section.price === null ? undefined : section.price,
                }))}
                courseId={params.courseId}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
