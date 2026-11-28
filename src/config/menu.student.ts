import {
  AlertTriangle,
  BookMarked,
  CalendarCheck,
  CheckSquare,
  FileText,
  Home,
  LayoutGrid,
  Layers,
  LifeBuoy,
  Network,
  Percent,
  Star,
  TrendingUp,
  Settings,
  Sparkles,
  GraduationCap,
  Map,
  Target,
  XCircle,
} from 'lucide-react';

import type { MenuGroup } from '@/layouts/types';
import { PATHS } from '@/routes/paths';

export const studentMenu: MenuGroup[] = [
  {
    items: [{ label: 'Trang chủ', icon: Home, path: PATHS.student.root, roles: ['student'] }],
  },
  {
    label: 'Học tập',
    items: [
      { label: 'Môn học của tôi', icon: GraduationCap, path: PATHS.student.courses, roles: ['student'] },
      {
        label: 'Mục tiêu ôn thi',
        icon: Target,
        roles: ['student'],
        children: [
          { label: 'Hôm nay', icon: CalendarCheck, path: PATHS.student.today, roles: ['student'] },
          { label: 'Lộ trình & mục tiêu', icon: Map, path: PATHS.student.planner, roles: ['student'] },
        ],
      },
      { label: 'Bản đồ tri thức', icon: Network, path: PATHS.student.knowledgeMap, roles: ['student'] },
      { label: 'Tài liệu của tôi', icon: FileText, path: PATHS.student.myDocuments, roles: ['student'] },
    ],
  },
  {
    label: 'Luyện tập và đánh giá',
    items: [
      {
        label: 'Luyện tập',
        icon: Percent,
        roles: ['student'],
        children: [
          { label: 'Tổng quan', icon: Percent, path: PATHS.student.practiceHub, roles: ['student'] },
          { label: 'Trắc nghiệm', icon: Percent, path: PATHS.student.practice, roles: ['student'] },
          { label: 'Sổ câu sai', icon: XCircle, path: PATHS.student.wrongItems, roles: ['student'] },
          { label: 'Ôn thẻ ghi nhớ', icon: Layers, path: PATHS.student.flashcardReview, roles: ['student'] },
        ],
      },
      { label: 'Bài kiểm tra và thi thử', icon: CheckSquare, path: PATHS.student.assessment, roles: ['student'] },
      { label: 'Mức độ thành thạo', icon: TrendingUp, path: PATHS.student.mastery, roles: ['student'] },
    ],
  },
  {
    label: 'Tài nguyên',
    items: [
      { label: 'Tài liệu học tập', icon: FileText, path: PATHS.student.resources, roles: ['student'] },
      // Flattened out of the old "Đề & tài nguyên" submenu — same routes, now top-level.
      { label: 'Thư viện đề thi', icon: BookMarked, path: PATHS.student.examLibrary, roles: ['student'] },
      { label: 'Tài nguyên khoá', icon: LayoutGrid, path: PATHS.student.courseResources, roles: ['student'] },
    ],
  },
  {
    label: 'Hỗ trợ',
    items: [
      { label: 'AI Trợ lý học tập', icon: Sparkles, path: PATHS.student.aiAssist, roles: ['student'] },
      {
        label: 'Hỗ trợ & phản hồi',
        icon: LifeBuoy,
        roles: ['student'],
        children: [
          { label: 'Cảnh báo rủi ro', icon: AlertTriangle, path: PATHS.student.riskItems, roles: ['student'] },
          { label: 'Yêu cầu hỗ trợ', icon: LifeBuoy, path: PATHS.student.supportItems, roles: ['student'] },
          { label: 'Báo cáo sự cố', icon: FileText, path: PATHS.student.adminReportItems, roles: ['student'] },
          { label: 'Góp ý của tôi', icon: Star, path: PATHS.student.reviewItems, roles: ['student'] },
        ],
      },
      { label: 'Cài đặt', icon: Settings, path: PATHS.student.settings, roles: ['student'] },
    ],
  },
];
