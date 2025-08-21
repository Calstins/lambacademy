// src/components/admin/course-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Eye, Trash2, Users } from 'lucide-react';
import Link from 'next/link';
import { deleteCourse, toggleCourseStatus } from '@/lib/actions/admin';
import { toast } from 'sonner';
import { useTransition } from 'react';

interface Course {
  id: string;
  title: string;
  description: string;
  isPaid: boolean;
  price?: number;
  isActive: boolean;
  createdAt: string;
  _count: {
    enrollments: number;
    sections: number;
  };
}

interface CourseCardProps {
  course: Course;
}

export function CourseCard({ course }: CourseCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (
      !confirm(
        'Are you sure you want to delete this course? This action cannot be undone.'
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteCourse(course.id);
      if (result.success) {
        toast.success('Course deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete course');
      }
    });
  };

  const handleToggleStatus = () => {
    startTransition(async () => {
      const result = await toggleCourseStatus(course.id, course.isActive);
      if (result.success) {
        toast.success(
          `Course ${
            !course.isActive ? 'activated' : 'deactivated'
          } successfully!`
        );
      } else {
        toast.error(result.error || 'Failed to update course status');
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <CardTitle className="text-xl">{course.title}</CardTitle>
              <Badge variant={course.isActive ? 'default' : 'secondary'}>
                {course.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {course.isPaid && (
                <Badge variant="outline" className="bg-accent text-primary">
                  ₦{course.price}
                </Badge>
              )}
            </div>
            <p className="text-gray-600 line-clamp-2">{course.description}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {course._count.enrollments} enrolled
            </div>
            <div>{course._count.sections} sections</div>
            <div>Created {new Date(course.createdAt).toLocaleDateString()}</div>
          </div>

          <div className="flex items-center space-x-2">
            <Link href={`/admin/courses/${course.id}`}>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-1" />
                View
              </Button>
            </Link>
            <Link href={`/admin/courses/${course.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={isPending}
            >
              {course.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={isPending}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
