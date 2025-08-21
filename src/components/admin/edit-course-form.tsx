// components/admin/edit-course-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { updateCourse } from '@/lib/actions/admin';

interface Course {
  id: string;
  title: string;
  description: string;
  learningObjectives: string[];
  curriculum: string;
  isPaid: boolean;
  price?: number;
  isActive: boolean;
}

interface CourseFormData {
  title: string;
  description: string;
  learningObjectives: { value: string }[];
  curriculum: string;
  isPaid: boolean;
  price?: number;
  isActive: boolean;
}

interface EditCourseFormProps {
  course: Course;
  courseId: string;
}

export function EditCourseForm({ course, courseId }: EditCourseFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    defaultValues: {
      title: course.title,
      description: course.description,
      learningObjectives: course.learningObjectives.map((obj) => ({
        value: obj,
      })),
      curriculum: course.curriculum,
      isPaid: course.isPaid,
      price: course.price || 0,
      isActive: course.isActive,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'learningObjectives',
  });

  const isPaid = watch('isPaid');

  const onSubmit = async (data: CourseFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('curriculum', data.curriculum);
      formData.append('isPaid', data.isPaid.toString());
      formData.append('isActive', data.isActive.toString());

      if (data.isPaid && data.price) {
        formData.append('price', data.price.toString());
      }

      formData.append(
        'learningObjectives',
        JSON.stringify(
          data.learningObjectives.map((obj) => obj.value).filter(Boolean)
        )
      );

      const result = await updateCourse(courseId, formData);

      if (result.success) {
        toast.success('Course updated successfully!');
        router.push(`/admin/courses/${courseId}`);
      } else {
        toast.error(result.error || 'Failed to update course');
      }
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
          Course Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Course Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Course Title *
            </Label>
            <Input
              id="title"
              placeholder="Enter course title"
              {...register('title', { required: 'Course title is required' })}
            />
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title.message}</p>
            )}
          </div>

          {/* Course Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Course Description *
            </Label>
            <Textarea
              id="description"
              placeholder="Enter course description"
              rows={4}
              {...register('description', {
                required: 'Course description is required',
              })}
            />
            {errors.description && (
              <p className="text-red-500 text-sm">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Learning Objectives *</Label>
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <Input
                  placeholder={`Learning objective ${index + 1}`}
                  {...register(`learningObjectives.${index}.value`, {
                    required: 'Learning objective is required',
                  })}
                />
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: '' })}
              className="mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Learning Objective
            </Button>
          </div>

          {/* Curriculum */}
          <div className="space-y-2">
            <Label htmlFor="curriculum" className="text-sm font-medium">
              Overall Curriculum *
            </Label>
            <Textarea
              id="curriculum"
              placeholder="Describe the overall curriculum structure"
              rows={6}
              {...register('curriculum', {
                required: 'Curriculum is required',
              })}
            />
            {errors.curriculum && (
              <p className="text-red-500 text-sm">
                {errors.curriculum.message}
              </p>
            )}
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <Controller
              name="isPaid"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPaid"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="isPaid">This is a paid course</Label>
                </div>
              )}
            />

            {isPaid && (
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Course Price (₦) *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Enter course price"
                  {...register('price', {
                    required: isPaid
                      ? 'Price is required for paid courses'
                      : false,
                    min: { value: 0, message: 'Price must be positive' },
                  })}
                />
                {errors.price && (
                  <p className="text-red-500 text-sm">{errors.price.message}</p>
                )}
              </div>
            )}
          </div>

          {/* Course Status */}
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <Label htmlFor="isActive">Course is active…</Label>
              </div>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary-800"
            >
              {isPending ? 'Updating Course...' : 'Update Course'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
