// app/dashboard/page.tsx
import { StudentLayout } from '@/components/student/student-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  Play,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import {
  getStudentDashboardStats,
  getStudentEnrollments,
} from '@/lib/actions/student';

export default async function StudentDashboard() {
  const [stats, enrollments] = await Promise.all([
    getStudentDashboardStats(),
    getStudentEnrollments(),
  ]);

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">Welcome Back!</h1>
          <p className="text-gray-600 mt-2">
            Continue your learning journey and track your progress.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Enrolled Courses
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.totalEnrollments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.completedCourses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.inProgressCourses}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Certificates
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {stats.totalCertificates}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Overview */}
        {stats.averageProgress > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Overall Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Average Completion</span>
                  <span>{stats.averageProgress.toFixed(1)}%</span>
                </div>
                <Progress value={stats.averageProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Courses */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-primary">My Courses</h2>
            <Link href="/dashboard/browse">
              <Button variant="outline">Browse More Courses</Button>
            </Link>
          </div>

          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-gray-500 mb-4">
                  <BookOpen className="w-12 h-12 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">
                    No courses enrolled yet
                  </h3>
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
                <Card key={enrollment.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
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
                              ₦{enrollment.course.price}
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {enrollment.course.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{enrollment.progressPercent}%</span>
                          </div>
                          <Progress
                            value={enrollment.progressPercent}
                            className="h-2"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-500">
                        Enrolled{' '}
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        {enrollment.completedAt && (
                          <span className="ml-2">
                            • Completed{' '}
                            {new Date(
                              enrollment.completedAt
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        {enrollment.completedAt ? (
                          <Link
                            href={`/dashboard/certificates/${enrollment.course.id}`}
                          >
                            <Button variant="outline" size="sm">
                              <Award className="w-4 h-4 mr-1" />
                              View Certificate
                            </Button>
                          </Link>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
