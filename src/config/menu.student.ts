import {
  BookMarked,
  CalendarDays,
  CheckSquare,
  FileText,
  Home,
  LayoutGrid,
  Network,
  Percent,
  TrendingUp,
  Settings,
  Sparkles,
  Bell,
  GraduationCap,
} from 'lucide-react';

import type { MenuGroup } from '@/layouts/types';
import { PATHS } from '@/routes/paths';

export const studentMenu: MenuGroup[] = [
  {
    items: [{ label: 'Tổng quan', icon: Home, path: PATHS.student.root, roles: ['student'] }],
  },
  {
    label: 'Học tập của tôi',
    items: [
      { label: 'Khoá học của tôi', icon: GraduationCap, path: PATHS.student.courses, roles: ['student'] },
      { label: 'Bản đồ tri thức', icon: Network, path: PATHS.student.knowledgeMap, roles: ['student'] },
      { label: 'Luyện tập', icon: Percent, path: PATHS.student.practice, roles: ['student'] },
      { label: 'Đánh giá', icon: CheckSquare, path: PATHS.student.assessment, roles: ['student'] },
      { label: 'Mức độ thành thạo', icon: TrendingUp, path: PATHS.student.mastery, roles: ['student'] },
      { label: 'Lộ kế hoạch học tập', icon: CalendarDays, path: PATHS.student.planner, roles: ['student'] },
    ],
  },
  {
    label: 'Tài nguyên',
    items: [
      { label: 'Tài liệu học tập', icon: FileText, path: PATHS.student.resources, roles: ['student'] },
      // Only merge made: "Thư viện đề thi" + "Tài nguyên khoá" folded into one submenu.
      {
        label: 'Đề & tài nguyên',
        icon: LayoutGrid,
        roles: ['student'],
        children: [
          { label: 'Thư viện đề thi', icon: BookMarked, path: PATHS.student.examLibrary, roles: ['student'] },
          { label: 'Tài nguyên khoá', icon: LayoutGrid, path: PATHS.student.courseResources, roles: ['student'] },
        ],
      },
    ],
  },
  {
    label: 'Hỗ trợ',
    items: [
      { label: 'AI Trợ lý học tập', icon: Sparkles, path: PATHS.student.aiAssist, roles: ['student'] },
      { label: 'Thông báo', icon: Bell, path: PATHS.student.notifications, roles: ['student'] },
      { label: 'Cài đặt', icon: Settings, path: PATHS.student.settings, roles: ['student'] },
    ],
  },
];
