import {
  AlertTriangle,
  BookMarked,
  CheckSquare,
  FileText,
  Home,
  LayoutGrid,
  LifeBuoy,
  Network,
  Percent,
  Star,
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
    // Order follows the real learning flow: pick a subject, see what it covers, plan it, practice,
    // get assessed, then track mastery — "Lộ kế hoạch học tập" used to sit in its own group after
    // this whole block, out of step with where planning actually happens.
    items: [
      { label: 'Khoá học của tôi', icon: GraduationCap, path: PATHS.student.courses, roles: ['student'] },
      { label: 'Bản đồ tri thức', icon: Network, path: PATHS.student.knowledgeMap, roles: ['student'] },
      {
        label: 'Lộ trình học tập',
        icon: Flag,
        path: PATHS.student.learningRoadmap,
        roles: ['student'],
      },
      { label: 'Luyện tập', icon: Percent, path: PATHS.student.practice, roles: ['student'] },
      { label: 'Đánh giá', icon: CheckSquare, path: PATHS.student.assessment, roles: ['student'] },
      { label: 'Mức độ thành thạo', icon: TrendingUp, path: PATHS.student.mastery, roles: ['student'] },
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
          {
            label: 'Tài nguyên khoá',
            icon: LayoutGrid,
            path: PATHS.student.courseResources,
            roles: ['student'],
          },
        ],
      },
    ],
  },
  {
    label: 'Hỗ trợ',
    items: [
      { label: 'AI Trợ lý học tập', icon: Sparkles, path: PATHS.student.aiAssist, roles: ['student'] },
      // Gộp các form phản hồi/báo cáo của học sinh vào một submenu cho gọn, thay vì 5 mục rời.
      {
        label: 'Phản hồi & hỗ trợ học tập',
        icon: LifeBuoy,
        roles: ['student'],
        children: [
          {
            label: 'Cảnh báo rủi ro',
            icon: AlertTriangle,
            path: PATHS.student.riskItems,
            roles: ['student'],
          },
          { label: 'Yêu cầu hỗ trợ', icon: LifeBuoy, path: PATHS.student.supportItems, roles: ['student'] },
          {
            label: 'Báo cáo sự cố',
            icon: FileText,
            path: PATHS.student.adminReportItems,
            roles: ['student'],
          },
          { label: 'Đánh giá của tôi', icon: Star, path: PATHS.student.reviewItems, roles: ['student'] },
        ],
      },
      { label: 'Thông báo', icon: Bell, path: PATHS.student.notifications, roles: ['student'] },
      { label: 'Cài đặt', icon: Settings, path: PATHS.student.settings, roles: ['student'] },
    ],
  },
];
