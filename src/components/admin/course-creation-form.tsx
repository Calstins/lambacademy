// components/admin/course-creation-form.tsx
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
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Award } from 'lucide-react';
import { createCourse } from '@/lib/actions/admin';

interface CourseFormData {
  title: string;
  description: string;
  learningObjectives: { value: string }[];
  curriculum: string;
  isPaid: boolean;
  price?: number;
  certificateEnabled: boolean;
  certificateRequireCompletion: boolean;
  certificateRequireMinScore: boolean;
  certificateMinScore?: number;
}

export function CourseCreationForm() {
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
      learningObjectives: [{ value: '' }],
      isPaid: false,
      certificateEnabled: true,
      certificateRequireCompletion: true,
      certificateRequireMinScore: false,
      certificateMinScore: 70,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'learningObjectives',
  });

  const isPaid = watch('isPaid');
  const certificateEnabled = watch('certificateEnabled');
  const certificateRequireMinScore = watch('certificateRequireMinScore');

  const onSubmit = async (data: CourseFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('curriculum', data.curriculum);
      formData.append('isPaid', data.isPaid.toString());
      formData.append('certificateEnabled', data.certificateEnabled.toString());
      formData.append(
        'certificateRequireCompletion',
        data.certificateRequireCompletion.toString()
      );
      formData.append(
        'certificateRequireMinScore',
        data.certificateRequireMinScore.toString()
      );

      if (data.isPaid && data.price) {
        formData.append('price', data.price.toString());
      }

      if (data.certificateRequireMinScore && data.certificateMinScore) {
        formData.append(
          'certificateMinScore',
          data.certificateMinScore.toString()
        );
      }

      formData.append(
        'learningObjectives',
        JSON.stringify(
          data.learningObjectives.map((obj) => obj.value).filter(Boolean)
        )
      );

      const result = await createCourse(formData);

      if (result.success) {
        toast.success('Course created successfully!');
        router.push(`/admin/courses/${result.courseId}`);
      } else {
        toast.error(result.error || 'Failed to create course');
      }
    });
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-primary">
          Create New Course
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
              control={control}
              name="isPaid"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    id="isPaid"
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
                <p className="text-sm text-gray-500">
                  Students must pay this amount to access the course content
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Certificate Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-accent" />
              <h3 className="text-lg font-semibold">Certificate Settings</h3>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="certificateEnabled"
                {...register('certificateEnabled')}
              />
              <Label
                htmlFor="certificateEnabled"
                className="text-sm font-medium"
              >
                Enable certificates for this course
              </Label>
            </div>

            {certificateEnabled && (
              <div className="ml-6 space-y-4">
                <Controller
                  control={control}
                  name="certificateRequireCompletion"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="certificateRequireCompletion"
                      />
                      <Label htmlFor="certificateRequireCompletion">
                        Require 100% course completion
                      </Label>
                    </div>
                  )}
                />

                <Controller
                  control={control}
                  name="certificateRequireMinScore"
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="certificateRequireMinScore"
                      />
                      <Label htmlFor="certificateRequireMinScore">
                        Require minimum score
                      </Label>
                    </div>
                  )}
                />

                {certificateRequireMinScore && (
                  <div className="ml-6 space-y-2">
                    <Label
                      htmlFor="certificateMinScore"
                      className="text-sm font-medium"
                    >
                      Minimum Score (%) *
                    </Label>
                    <Input
                      id="certificateMinScore"
                      type="number"
                      min="0"
                      max="100"
                      placeholder="70"
                      {...register('certificateMinScore', {
                        required: certificateRequireMinScore
                          ? 'Minimum score is required'
                          : false,
                        min: { value: 0, message: 'Score cannot be negative' },
                        max: {
                          value: 100,
                          message: 'Score cannot exceed 100%',
                        },
                      })}
                    />
                    {errors.certificateMinScore && (
                      <p className="text-red-500 text-sm">
                        {errors.certificateMinScore.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      Students must achieve this score average to earn a
                      certificate
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

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
              {isPending ? 'Creating Course...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
