// components/admin/lecture-management.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UploadDropzone } from '@/lib/uploadthing';
import type { UploadRouter } from '@/lib/uploadthing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Video,
  FileText,
  HelpCircle,
  ClipboardList,
  Upload,
} from 'lucide-react';
import {
  getLectures,
  createLecture,
  updateLecture,
  deleteLecture,
} from '@/lib/actions/admin';
import QuizBuilder from '@/components/admin/quiz-builder';

interface Lecture {
  id: string;
  title: string;
  order: number;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'PRACTICE_TEST' | 'ASSIGNMENT' | 'PDF';
  content: any;
}

interface LectureFormData {
  title: string;
  type: 'VIDEO' | 'TEXT' | 'QUIZ' | 'PRACTICE_TEST' | 'ASSIGNMENT' | 'PDF';
  content: any;
}

interface LectureManagementProps {
  sectionId: string;
}

const lectureTypes = [
  { value: 'VIDEO', label: 'Video', icon: Video },
  { value: 'TEXT', label: 'Text Article', icon: FileText },
  { value: 'QUIZ', label: 'Quiz', icon: HelpCircle },
  { value: 'PRACTICE_TEST', label: 'Practice Test', icon: ClipboardList },
  { value: 'ASSIGNMENT', label: 'Assignment', icon: ClipboardList },
  { value: 'PDF', label: 'PDF Document', icon: Upload },
];

export function LectureManagement({ sectionId }: LectureManagementProps) {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('VIDEO');
  const [isPending, startTransition] = useTransition();
  const [quizDialog, setQuizDialog] = useState<{
    open: boolean;
    lectureId: string | null;
    type: 'QUIZ' | 'PRACTICE_TEST' | null;
  }>({ open: false, lectureId: null, type: null });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LectureFormData>();

  const watchType = watch('type');

  useEffect(() => {
    fetchLectures();
  }, [sectionId]);

  const fetchLectures = async () => {
    try {
      const data = await getLectures(sectionId);
      setLectures(data);
    } catch (error) {
      toast.error('Failed to fetch lectures');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: LectureFormData) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('type', data.type);
      formData.append('content', JSON.stringify(data.content || {}));

      const result = editingLecture
        ? await updateLecture(editingLecture.id, formData)
        : await createLecture(sectionId, formData);

      if (result.success) {
        toast.success(editingLecture ? 'Lecture updated!' : 'Lecture created!');
        await fetchLectures();
        setDialogOpen(false);
        setEditingLecture(null);
        reset();
      } else {
        toast.error(result.error || 'Failed to save lecture');
      }
    });
  };

  const handleDeleteLecture = async (lectureId: string) => {
    if (!confirm('Are you sure you want to delete this lecture?')) return;

    startTransition(async () => {
      const result = await deleteLecture(lectureId);
      if (result.success) {
        toast.success('Lecture deleted!');
        await fetchLectures();
      } else {
        toast.error(result.error || 'Failed to delete lecture');
      }
    });
  };

  const openEditDialog = (lecture: Lecture) => {
    setEditingLecture(lecture);
    setSelectedType(lecture.type);
    reset({
      title: lecture.title,
      type: lecture.type,
      content: lecture.content,
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingLecture(null);
    setSelectedType('VIDEO');
    reset({ title: '', type: 'VIDEO', content: {} });
    setDialogOpen(true);
  };

  const renderContentForm = () => {
    switch (watchType || selectedType) {
      case 'VIDEO':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL *</Label>
              <Input
                id="videoUrl"
                placeholder="Enter YouTube, Vimeo, or other video URL"
                {...register('content.videoUrl', {
                  required: 'Video URL is required',
                })}
              />
              <p className="text-sm text-gray-500">
                Supports YouTube, Vimeo, and other embedded video URLs
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Optional video description"
                {...register('content.description')}
              />
            </div>
          </div>
        );

      case 'TEXT':
        return (
          <div className="space-y-2">
            <Label htmlFor="textContent">Article Content *</Label>
            <Textarea
              id="textContent"
              placeholder="Enter the article content"
              rows={10}
              {...register('content.textContent', {
                required: 'Content is required',
              })}
            />
          </div>
        );

      case 'QUIZ':
      case 'PRACTICE_TEST':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Enter quiz instructions"
                {...register('content.instructions')}
              />
            </div>
            <p className="text-sm text-gray-500">
              Questions will be managed separately after creating this lecture.
            </p>
          </div>
        );

      case 'ASSIGNMENT':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assignmentDescription">
                Assignment Description *
              </Label>
              <Textarea
                id="assignmentDescription"
                placeholder="Describe the assignment requirements"
                rows={6}
                {...register('content.description', {
                  required: 'Description is required',
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...register('content.dueDate')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxPoints">Maximum Points</Label>
              <Input
                id="maxPoints"
                type="number"
                placeholder="Enter maximum points"
                {...register('content.maxPoints')}
              />
            </div>
          </div>
        );

      case 'PDF':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>PDF Document *</Label>
              <UploadDropzone<UploadRouter, 'pdfUploader'>
                endpoint="pdfUploader"
                onClientUploadComplete={(files) => {
                  const f = files?.[0];
                  if (!f) return;
                  setValue('content.pdfUrl', f.url, { shouldDirty: true });
                  setValue('content.fileName', f.name ?? 'document.pdf', {
                    shouldDirty: true,
                  });
                  toast.success('PDF uploaded successfully!');
                }}
                onUploadError={(error) => {
                  toast.error(error.message ?? 'Upload failed');
                }}
              />
              <p className="text-sm text-gray-500">
                Upload a PDF file (max 8MB)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pdfDescription">Description</Label>
              <Textarea
                id="pdfDescription"
                placeholder="Optional description for the PDF"
                {...register('content.description')}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getLectureIcon = (type: string) => {
    const lectureType = lectureTypes.find((t) => t.value === type);
    return lectureType ? lectureType.icon : FileText;
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading lectures...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-semibold">Lectures</h4>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openCreateDialog}
              size="sm"
              className="bg-primary hover:bg-primary-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Lecture
            </Button>
          </DialogTrigger>
          <DialogContent className="h-[600px] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingLecture ? 'Edit Lecture' : 'Create New Lecture'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Lecture Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter lecture title"
                  {...register('title', {
                    required: 'Lecture title is required',
                  })}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Lecture Type *</Label>
                <Select
                  value={watchType || selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value);
                    setValue('type', value as any);
                    // Reset content when type changes
                    setValue('content', {});
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lecture type" />
                  </SelectTrigger>
                  <SelectContent
                    className="z-[70]"
                    position="popper"
                    side="bottom"
                    align="start"
                  >
                    {lectureTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="w-4 h-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-4">Content Configuration</h3>
                {renderContentForm()}
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
                    : editingLecture
                    ? 'Update'
                    : 'Create'}{' '}
                  Lecture
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {lectures.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No lectures created yet. Click &apos;Add Lecture&apos; to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {lectures.map((lecture, index) => {
            const Icon = getLectureIcon(lecture.type);
            return (
              <Card key={lecture.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">
                        {index + 1}.
                      </span>
                      <Icon className="w-5 h-5 text-gray-600" />
                      <div>
                        <h5 className="font-medium">{lecture.title}</h5>
                        <p className="text-sm text-gray-600">
                          {
                            lectureTypes.find((t) => t.value === lecture.type)
                              ?.label
                          }
                        </p>
                        {/* Show content preview based on type */}
                        {lecture.type === 'VIDEO' &&
                          lecture.content.videoUrl && (
                            <p className="text-xs text-blue-600 mt-1">
                              📹 {lecture.content.videoUrl.substring(0, 50)}...
                            </p>
                          )}
                        {lecture.type === 'PDF' && lecture.content.fileName && (
                          <p className="text-xs text-green-600 mt-1">
                            📄 {lecture.content.fileName}
                          </p>
                        )}
                        {lecture.type === 'TEXT' &&
                          lecture.content.textContent && (
                            <p className="text-xs text-purple-600 mt-1">
                              📝 {lecture.content.textContent.substring(0, 40)}
                              ...
                            </p>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {(lecture.type === 'QUIZ' ||
                        lecture.type === 'PRACTICE_TEST') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setQuizDialog({
                              open: true,
                              lectureId: lecture.id,
                              type: lecture.type as 'QUIZ' | 'PRACTICE_TEST',
                            })
                          }
                        >
                          Manage Questions
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(lecture)}
                        disabled={isPending}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteLecture(lecture.id)}
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
          })}
        </div>
      )}

      <Dialog
        open={quizDialog.open}
        onOpenChange={(o) => setQuizDialog((s) => ({ ...s, open: o }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {quizDialog.type === 'PRACTICE_TEST' ? 'Practice Test' : 'Quiz'}{' '}
              Builder
            </DialogTitle>
          </DialogHeader>
          {quizDialog.lectureId && quizDialog.type && (
            <QuizBuilder
              lectureId={quizDialog.lectureId}
              lectureType={quizDialog.type}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
