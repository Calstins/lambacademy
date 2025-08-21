// app/dashboard/courses/page.tsx
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  Award,
  Calendar,
  Filter,
  Search,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { getStudentEnrollments } from '@/lib/actions/student';

export default async function StudentCoursesPage() {
  const enrollments = await getStudentEnrollments();

  const completedCourses = enrollments.filter((e) => e.completedAt);
  const inProgressCourses = enrollments.filter((e) => !e.completedAt);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">My Courses</h1>
            <p className="text-gray-600 mt-2">
              Track your learning progress and continue where you left off.
            </p>
          </div>
          <Link href="/dashboard/browse">
            <Button className="bg-primary hover:bg-primary-800">
              <BookOpen className="w-4 h-4 mr-2" />
              Browse More Courses
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Enrolled
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {enrollments.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Active enrollments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {inProgressCourses.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Courses to complete
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {completedCourses.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Certificates earned
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search your courses..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        {enrollments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="text-gray-500 mb-4">
                <BookOpen className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No courses enrolled yet</h3>
                <p className="text-sm">
                  Start learning by browsing our available courses.
                </p>
              </div>
              <Link href="/dashboard/browse">
                <Button className="bg-primary hover:bg-primary-800">
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Course Thumbnail Placeholder */}
                    <div className="w-full lg:w-48 h-32 bg-gradient-to-br from-primary via-primary-800 to-primary-900 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-white/80" />
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-xl font-semibold">
                              {enrollment.course.title}
                            </h3>
                            {enrollment.completedAt ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completed
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                <Clock className="w-3 h-3 mr-1" />
                                In Progress
                              </Badge>
                            )}
                            {enrollment.course.isPaid && (
                              <Badge
                                variant="outline"
                                className="bg-accent text-primary"
                              >
                                ₦{enrollment.course.price?.toLocaleString()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600 mb-4 line-clamp-2">
                            {enrollment.course.description}
                          </p>

                          {/* Progress */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span className="font-medium">
                                {Math.round(enrollment.progressPercent)}%
                              </span>
                            </div>
                            <Progress
                              value={enrollment.progressPercent}
                              className="h-2"
                            />
                          </div>

                          {/* Meta Info */}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-4">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Enrolled{' '}
                              {new Date(
                                enrollment.enrolledAt
                              ).toLocaleDateString()}
                            </div>
                            {enrollment.completedAt && (
                              <div className="flex items-center">
                                <Award className="w-4 h-4 mr-1" />
                                Completed{' '}
                                {new Date(
                                  enrollment.completedAt
                                ).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {enrollment.completedAt ? (
                          <>
                            <Link
                              href={`/dashboard/courses/${enrollment.course.id}`}
                            >
                              <Button variant="outline" size="sm">
                                <BookOpen className="w-4 h-4 mr-1" />
                                Review Course
                              </Button>
                            </Link>
                            <Link href={`/dashboard/certificates`}>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Award className="w-4 h-4 mr-1" />
                                View Certificate
                              </Button>
                            </Link>
                          </>
                        ) : (
                          <Link
                            href={`/dashboard/courses/${enrollment.course.id}`}
                          >
                            <Button
                              size="sm"
                              className="bg-primary hover:bg-primary-800"
                            >
                              <Play className="w-4 h-4 mr-1" />
                              Continue Learning
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
