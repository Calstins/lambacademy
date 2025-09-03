// components/student/course-grid.tsx
'use client';

import { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  BookOpen,
  Search,
  Filter,
  Users,
  Star,
  ShoppingCart,
  Award,
  Lock,
  Play,
  Clock,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { enrollInFreeCourse } from '@/lib/actions/student';

interface Course {
  id: string;
  title: string;
  description: string;
  isPaid: boolean;
  price?: number;
  isActive: boolean;
  certificateEnabled: boolean;
  _count: {
    enrollments: number;
    sections: number;
  };
  sections: {
    id: string;
    isPaid: boolean;
    price?: number;
  }[];
  isEnrolled?: boolean;
}

interface CourseGridProps {
  courses: Course[];
}

export function CourseGrid({ courses }: CourseGridProps) {
  const [filteredCourses, setFilteredCourses] = useState(courses);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filterCourses = (search: string, price: string) => {
    let filtered = courses;

    if (search) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(search.toLowerCase()) ||
          course.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (price !== 'ALL') {
      if (price === 'FREE') {
        filtered = filtered.filter((course) => !course.isPaid);
      } else if (price === 'PAID') {
        filtered = filtered.filter((course) => course.isPaid);
      }
    }

    setFilteredCourses(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    filterCourses(value, priceFilter);
  };

  const handlePriceFilterChange = (value: string) => {
    setPriceFilter(value);
    filterCourses(searchTerm, value);
  };

  const calculateTotalPrice = (course: Course) => {
    let total = course.isPaid ? course.price || 0 : 0;
    const paidSections = course.sections.filter((s) => s.isPaid);
    total += paidSections.reduce(
      (sum, section) => sum + (section.price || 0),
      0
    );
    return total;
  };

  const handleEnrollClick = (course: Course) => {
    if (course.isPaid || course.sections.some((s) => s.isPaid)) {
      setSelectedCourse(course);
      setShowPurchaseDialog(true);
    } else {
      handleFreeEnroll(course.id);
    }
  };

  const handleFreeEnroll = async (courseId: string) => {
    startTransition(async () => {
      const result = await enrollInFreeCourse(courseId);
      if (result.success) {
        toast.success('Successfully enrolled in course!');
        setFilteredCourses((prev) =>
          prev.map((course) =>
            course.id === courseId ? { ...course, isEnrolled: true } : course
          )
        );
      } else {
        toast.error(result.error || 'Failed to enroll in course');
      }
    });
  };

  const handlePurchase = async () => {
    if (!selectedCourse) return;

    startTransition(async () => {
      try {
        const totalPrice = calculateTotalPrice(selectedCourse);

        console.log('Initiating purchase:', {
          courseId: selectedCourse.id,
          amount: totalPrice,
          includeAllSections: true,
        });

        const response = await fetch('/api/payment/initialize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: selectedCourse.id,
            amount: totalPrice,
            includeAllSections: true, // This will now be handled properly
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Payment initialization successful:', result);

          if (result.authorization_url) {
            // Store course ID for callback page
            localStorage.setItem('pendingCourseId', selectedCourse.id);
            window.location.href = result.authorization_url;
          } else {
            toast.error('Invalid payment response');
          }
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          toast.error(errorData.error || 'Failed to initialize payment');
        }
      } catch (error) {
        console.error('Payment initialization failed:', error);
        toast.error('Payment initialization failed');
      }
    });
  };

  return (
    <>
      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Select
                  value={priceFilter}
                  onValueChange={handlePriceFilterChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Courses</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Course Grid */}
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses found</h3>
              <p className="text-sm">
                Try adjusting your search or filter criteria.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => {
              const totalPrice = calculateTotalPrice(course);
              const hasPaidSections = course.sections.some((s) => s.isPaid);

              return (
                <Card key={course.id} className="flex flex-col h-full">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {course.title}
                      </CardTitle>
                      <div className="flex flex-col items-end space-y-1">
                        {course.isPaid ? (
                          <Badge
                            variant="outline"
                            className="bg-accent text-primary"
                          >
                            ₦{course.price?.toLocaleString()}
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800">
                            Free
                          </Badge>
                        )}
                        {hasPaidSections && (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700 text-xs"
                          >
                            <Lock className="w-3 h-3 mr-1" />
                            Premium Sections
                          </Badge>
                        )}
                        {course.certificateEnabled && (
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 text-xs"
                          >
                            <Award className="w-3 h-3 mr-1" />
                            Certificate
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {course.description}
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col justify-between">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {course._count.enrollments} students
                        </div>
                        <div className="flex items-center">
                          <BookOpen className="w-4 h-4 mr-1" />
                          {course._count.sections} sections
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div className="flex text-accent">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-current" />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600 ml-2">
                          (4.8)
                        </span>
                      </div>

                      {totalPrice > 0 && (
                        <div className="p-2 bg-gray-50 rounded-lg">
                          <div className="text-sm text-gray-600">
                            Total Investment:
                          </div>
                          <div className="text-lg font-bold text-primary">
                            ₦{totalPrice.toLocaleString()}
                          </div>
                          {hasPaidSections && (
                            <div className="text-xs text-gray-500">
                              Includes all premium sections
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {course.isEnrolled ? (
                      <Button disabled className="w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Already Enrolled
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleEnrollClick(course)}
                        disabled={isPending}
                        className="w-full bg-primary hover:bg-primary-800"
                      >
                        {course.isPaid || hasPaidSections ? (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Purchase Full Access
                          </>
                        ) : (
                          <>
                            <BookOpen className="w-4 h-4 mr-2" />
                            Enroll Now
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Purchase Dialog */}
      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Purchase Course Access
            </DialogTitle>
            <DialogDescription>
              Get full access to this course and all its content.
            </DialogDescription>
          </DialogHeader>

          {selectedCourse && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium">{selectedCourse.title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedCourse._count.sections} sections •{' '}
                  {selectedCourse._count.enrollments} students enrolled
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Course Content:</span>
                  <span className="font-medium">
                    {selectedCourse.isPaid
                      ? `₦${selectedCourse.price?.toLocaleString()}`
                      : 'Free'}
                  </span>
                </div>

                {selectedCourse.sections.filter((s) => s.isPaid).length > 0 && (
                  <div className="flex justify-between items-center">
                    <span>
                      Premium Sections (
                      {selectedCourse.sections.filter((s) => s.isPaid).length}):
                    </span>
                    <span className="font-medium">
                      ₦
                      {selectedCourse.sections
                        .filter((s) => s.isPaid)
                        .reduce((sum, s) => sum + (s.price || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="border-t pt-2 flex justify-between items-center font-bold">
                  <span>Total:</span>
                  <span className="text-lg text-primary">
                    ₦{calculateTotalPrice(selectedCourse).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-start space-x-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">What you get:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Lifetime access to all course content</li>
                    <li>Access to all premium sections</li>
                    {selectedCourse.certificateEnabled && (
                      <li>Certificate of completion</li>
                    )}
                    <li>Student support and community access</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPurchaseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isPending}
              className="bg-primary hover:bg-primary-800"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isPending
                ? 'Processing...'
                : `Pay ₦${
                    selectedCourse
                      ? calculateTotalPrice(selectedCourse).toLocaleString()
                      : '0'
                  }`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
