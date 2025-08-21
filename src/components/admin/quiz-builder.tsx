'use client';

import React from 'react';
import { useTransition, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  getQuizEditorData,
  upsertQuizTitle,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  reorderQuestions,
} from '@/lib/actions/admin-quiz';
import type { EditorLoadDTO } from '@/lib/actions/admin-quiz';
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';

type Props = {
  lectureId: string;
  /** Provide lectureType so we can label UI properly */
  lectureType: 'QUIZ' | 'PRACTICE_TEST';
};

export default function QuizBuilder({ lectureId, lectureType }: Props) {
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<EditorLoadDTO | null>(null);

  // local title edit
  const [title, setTitle] = useState('');

  // add question form state
  const [qText, setQText] = useState('');
  const [opts, setOpts] = useState<string[]>(['', '', '', '']);
  const [correct, setCorrect] = useState(0);

  const label = lectureType === 'QUIZ' ? 'Quiz' : 'Practice Test';

  const load = () =>
    startTransition(async () => {
      const d = await getQuizEditorData(lectureId);
      setData(d);
      setTitle(d.quiz?.title || d.lecture.title);
    });

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lectureId]);

  const onSaveTitle = () =>
    startTransition(async () => {
      const res = await upsertQuizTitle(lectureId, title.trim());
      if (res.success) {
        toast.success(`${label} title saved`);
        load();
      } else {
        toast.error(res.error || 'Failed to save title');
      }
    });

  const onAddQuestion = () =>
    startTransition(async () => {
      const res = await addQuestion(lectureId, {
        question: qText,
        options: opts,
        correct,
      });
      if (res.success) {
        toast.success('Question added');
        setQText('');
        setOpts(['', '', '', '']);
        setCorrect(0);
        load();
      } else {
        toast.error(res.error || 'Failed to add question');
      }
    });

  const move = (idx: number, dir: -1 | 1) =>
    startTransition(async () => {
      if (!data?.quiz) return;
      const qs = [...data.quiz.questions];
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= qs.length) return;

      // swap order numbers
      const a = qs[idx];
      const b = qs[swapIdx];
      const items = [
        { id: a.id, order: b.order },
        { id: b.id, order: a.order },
      ];
      const res = await reorderQuestions(data.quiz.id, items);
      if (res.success) {
        load();
      } else {
        toast.error(res.error || 'Failed to reorder');
      }
    });

  return (
    <Card className="max-w-3xl max-h-[85vh]">
      <CardHeader>
        <CardTitle>{label} Builder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8 overflow-y-auto max-h-[72vh] pr-2">
        {/* Title row */}
        <div className="space-y-2">
          <Label>{label} Title</Label>
          <div className="flex gap-2">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`${label} title`}
            />
            <Button onClick={onSaveTitle} disabled={isPending}>
              <Save className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Existing questions */}
        <div className="space-y-3">
          <div className="font-semibold">{label} Questions</div>

          {!data?.quiz || data.quiz.questions.length === 0 ? (
            <div className="rounded border p-4 text-sm text-gray-600">
              {lectureType === 'QUIZ'
                ? 'No quiz questions yet.'
                : 'No practice test questions yet.'}
            </div>
          ) : (
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {data.quiz.questions
                .sort((a, b) => a.order - b.order)
                .map((q, i) => (
                  <QuestionRow
                    key={q.id}
                    index={i}
                    q={q}
                    total={data.quiz!.questions.length}
                    onMove={(dir) => move(i, dir)}
                    onDelete={async () => {
                      const res = await deleteQuestion(q.id);
                      if (res.success) {
                        toast.success('Deleted');
                        load();
                      } else {
                        toast.error(res.error || 'Failed to delete');
                      }
                    }}
                    onSave={async (payload) => {
                      const res = await updateQuestion(q.id, payload);
                      if (res.success) {
                        toast.success('Saved');
                        load();
                      } else {
                        toast.error(res.error || 'Failed to save');
                      }
                    }}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Add question */}
        <div className="space-y-2">
          <div className="font-semibold">Add new question</div>
          <Textarea
            value={qText}
            onChange={(e) => setQText(e.target.value)}
            placeholder="Question text"
            rows={3}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opts.map((op, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={correct === idx}
                  onChange={() => setCorrect(idx)}
                  aria-label={`Mark option ${idx + 1} as correct`}
                />
                <Input
                  value={op}
                  onChange={(e) => {
                    const next = [...opts];
                    next[idx] = e.target.value;
                    setOpts(next);
                  }}
                  placeholder={`Option ${idx + 1}`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={onAddQuestion} disabled={isPending}>
              <Plus className="w-4 h-4 mr-1" />
              Add Question
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuestionRow({
  q,
  index,
  total,
  onMove,
  onDelete,
  onSave,
}: {
  q: {
    id: string;
    order: number;
    question: string;
    options: string[];
    correct: number;
  };
  index: number;
  total: number;
  onMove: (dir: -1 | 1) => void;
  onDelete: () => void;
  onSave: (payload: {
    question?: string;
    options?: string[];
    correct?: number;
  }) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [question, setQuestion] = useState(q.question);
  const [options, setOptions] = useState<string[]>(q.options);
  const [correct, setCorrect] = useState<number>(q.correct);
  const [isPending, startTransition] = useTransition();

  const save = () =>
    startTransition(async () => {
      await onSave({ question, options, correct });
      setEditing(false);
    });

  return (
    <div className="rounded border p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="font-medium">
          {index + 1}. {editing ? '(editing)' : q.question}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move up"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
            aria-label="Move down"
          >
            <ArrowDown className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditing((s) => !s)}
          >
            {editing ? 'Cancel' : 'Edit'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-red-600"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      {editing && (
        <div className="space-y-3">
          <Textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((op, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  aria-label={`Mark option ${i + 1} as correct`}
                />
                <Input
                  value={op}
                  onChange={(e) => {
                    const next = [...options];
                    next[i] = e.target.value;
                    setOptions(next);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={isPending}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {!editing && (
        <div className="text-sm text-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {q.options.map((op, i) => (
              <div key={i} className={i === q.correct ? 'font-semibold' : ''}>
                {i === q.correct ? '✓ ' : ''} {op}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
