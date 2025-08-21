// components/admin/section-management.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
} from '@/lib/actions/admin';

interface Section {
  id: string;
  title: string;
  order: number;
  isPaid: boolean;
  price?: number | null;
  _count: {
    lectures: number;
  };
}

interface SectionFormData {
  title: string;
  isPaid: boolean;
  price?: number;
}

interface SectionManagementProps {
  courseId: string;
}

export function SectionManagement({ courseId }: SectionManagementProps) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SectionFormData>();

  const isPaid = watch('isPaid');

  useEffect(() => {
    fetchSections();
  }, [courseId]);

  const fetchSections = async () => {
    try {
      const data = await getSections(courseId);
      setSections(data); //error: 'TYPE ERROR'
    } catch (error) {
      toast.error('Failed to fetch sections');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SectionFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('isPaid', data.isPaid.toString());
      if (data.isPaid && data.price) {
        formData.append('price', data.price.toString());
      }

      const result = editingSection
        ? await updateSection(editingSection.id, formData)
        : await createSection(courseId, formData);

      if (result.success) {
        toast.success(editingSection ? 'Section updated!' : 'Section created!');
        await fetchSections();
        setDialogOpen(false);
        setEditingSection(null);
        reset();
      } else {
        toast.error(result.error || 'Failed to save section');
      }
    });
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    startTransition(async () => {
      const result = await deleteSection(sectionId);
      if (result.success) {
        toast.success('Section deleted!');
        await fetchSections();
      } else {
        toast.error(result.error || 'Failed to delete section');
      }
    });
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = sections.findIndex((s) => s.id === sectionId);
    if (
      (direction === 'up' && sectionIndex === 0) ||
      (direction === 'down' && sectionIndex === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex =
      direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;

    // Swap sections
    [newSections[sectionIndex], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[sectionIndex],
    ];

    // Update order values
    newSections.forEach((section, index) => {
      section.order = index + 1;
    });

    setSections(newSections);

    startTransition(async () => {
      const result = await reorderSections(
        newSections.map((s) => ({ id: s.id, order: s.order }))
      );

      if (result.success) {
        toast.success('Section order updated!');
      } else {
        toast.error(result.error || 'Failed to update section order');
        await fetchSections(); // Revert on error
      }
    });
  };

  const openEditDialog = (section: Section) => {
    setEditingSection(section);
    reset({
      title: section.title,
      isPaid: section.isPaid,
      price: section.price || 0,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingSection(null);
    reset({ title: '', isPaid: false, price: 0 });
    setDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading sections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Course Sections</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              className="bg-primary hover:bg-primary-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingSection ? 'Edit Section' : 'Create New Section'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Section Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter section title"
                  {...register('title', {
                    required: 'Section title is required',
                  })}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

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
                      <Label htmlFor="isPaid">
                        This section requires payment
                      </Label>
                    </div>
                  )}
                />

                {isPaid && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Section Price (₦) *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="Enter section price"
                      {...register('price', {
                        required: isPaid ? 'Price is required' : false,
                        min: { value: 0, message: 'Price must be positive' },
                      })}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm">
                        {errors.price.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-800"
                >
                  {isPending
                    ? 'Saving...'
                    : editingSection
                    ? 'Update'
                    : 'Create'}{' '}
                  Section
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            No sections created yet. Click &apos;Add Section&apos; to get
            started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, index) => (
            <Card key={section.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">
                        Section {section.order}
                      </span>
                      <h4 className="font-semibold">{section.title}</h4>
                      {section.isPaid && (
                        <span className="px-2 py-1 text-xs bg-accent text-primary rounded-full">
                          ₦{section.price}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {section._count.lectures} lecture(s)
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0 || isPending}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === sections.length - 1 || isPending}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(section)}
                      disabled={isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSection(section.id)}
                      disabled={isPending}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
