import { motion } from 'framer-motion';
import { BookOpenCheck, Calculator, ChartColumn } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { CourseThumb } from '@/components/illustrations/CourseThumb';
import { StatusBadge } from '@/components/StatusBadge';
import type { CourseStatus, StudentCourse } from '@/mocks/dashboardMocks';

const STATUS_ICON: Record<StudentCourse['tone'], LucideIcon> = {
  blue: Calculator,
  peach: ChartColumn,
  mint: BookOpenCheck,
};

const STATUS_MAP: Record<CourseStatus, { variant: 'success' | 'warning' | 'info'; label: string }> = {
  learning: { variant: 'info', label: 'Đang học' },
  review: { variant: 'warning', label: 'Cần ôn lại' },
  started: { variant: 'success', label: 'Mới bắt đầu' },
};

interface CourseCardProps {
  course: StudentCourse;
  onOpen?: (id: string) => void;
}

export function CourseCard({ course, onOpen }: CourseCardProps) {
  const status = STATUS_MAP[course.status];

  return (
    <motion.button
      type="button"
      onClick={() => onOpen?.(course.id)}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18 }}
      className="flex flex-col gap-3 rounded-card border border-border bg-card p-4 text-left shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CourseThumb tone={course.tone} icon={STATUS_ICON[course.tone]} />

      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-muted-foreground">
            {course.code} · {course.chapters} chương
          </div>
          <div className="truncate text-[15px] font-bold text-foreground">{course.name}</div>
        </div>
        <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
          <span>Tiến độ</span>
          <span className="font-semibold text-foreground">{course.progress}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary" style={{ width: `${course.progress}%` }} />
        </div>
      </div>
    </motion.button>
  );
}
