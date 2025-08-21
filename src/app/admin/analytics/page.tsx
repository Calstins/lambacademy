// app/admin/analytics/page.tsx
import { AdminLayout } from '@/components/admin/admin-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  Users,
  BookOpen,
  Award,
  TrendingUp,
  DollarSign,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { getAnalyticsData } from '@/lib/actions/analytics';

export default async function AdminAnalyticsPage() {
  const analytics = await getAnalyticsData();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Track platform performance and student engagement metrics.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select defaultValue="30">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 3 months</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ₦{analytics.totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Students
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {analytics.totalStudents}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Course Views
              </CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {analytics.courseViews}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +8% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">
                {analytics.completionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 inline mr-1" />
                +2% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.topCourses.map((course: any, index: number) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-gray-500">
                          {course._count.enrollments} enrollments
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-green-600">
                        ₦{course.revenue?.toLocaleString() || '0'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {course.completionRate}% completion
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Student Engagement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Active Students (Last 7 days)</span>
                  <span className="font-bold">{analytics.activeStudents}</span>
                </div>
                <Progress value={75} className="h-2" />

                <div className="flex justify-between items-center">
                  <span>Course Completion Rate</span>
                  <span className="font-bold">
                    {analytics.completionRate.toFixed(1)}%
                  </span>
                </div>
                <Progress value={analytics.completionRate} className="h-2" />

                <div className="flex justify-between items-center">
                  <span>Certificate Issued</span>
                  <span className="font-bold">
                    {analytics.certificatesIssued}
                  </span>
                </div>
                <Progress value={60} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Course Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {analytics.courseStats.map((course: any) => (
                <div key={course.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium line-clamp-1">{course.title}</h4>
                    {course.isPaid ? (
                      <Badge
                        variant="outline"
                        className="bg-accent text-primary"
                      >
                        ₦{course.price}
                      </Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        Free
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Enrollments:</span>
                      <span className="font-medium">
                        {course._count.enrollments}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed:</span>
                      <span className="font-medium">
                        {course.completedCount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className="font-medium">
                        {course.completionPercentage}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-medium text-green-600">
                        ₦{course.revenue?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>

                  <Progress
                    value={course.completionPercentage}
                    className="h-2 mt-3"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Enrollment Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyEnrollments.map((month: any) => (
                  <div
                    key={month.month}
                    className="flex justify-between items-center"
                  >
                    <span>{month.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${
                              (month.count / analytics.maxMonthlyEnrollments) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-medium w-8 text-right">
                        {month.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics.monthlyRevenue.map((month: any) => (
                  <div
                    key={month.month}
                    className="flex justify-between items-center"
                  >
                    <span>{month.month}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{
                            width: `${
                              (month.revenue / analytics.maxMonthlyRevenue) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <span className="font-medium text-green-600">
                        ₦{month.revenue?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
