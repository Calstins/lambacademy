// components/admin/section-selector.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LectureManagement } from './lecture-management';

interface Section {
  id: string;
  title: string;
  order: number;
  isPaid: boolean;
  price?: number;
  _count: {
    lectures: number;
  };
}

interface SectionSelectorProps {
  sections: Section[];
  courseId: string;
}

export function SectionSelector({ sections, courseId }: SectionSelectorProps) {
  const [selectedSection, setSelectedSection] = useState<string>(
    sections.length > 0 ? sections[0].id : ''
  );

  if (sections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No sections available. Create a section first to add lectures.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => (
          <Button
            key={section.id}
            variant={selectedSection === section.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedSection(section.id)}
            className="flex items-center space-x-2"
          >
            <span>{section.title}</span>
            <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
              {section._count.lectures}
            </span>
          </Button>
        ))}
      </div>

      {/* Selected Section's Lecture Management */}
      {selectedSection && (
        <div className="border-t pt-6">
          <LectureManagement sectionId={selectedSection} />
        </div>
      )}
    </div>
  );
}
