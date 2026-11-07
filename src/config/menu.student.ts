import {
  Bell,
  BookOpen,
  Home,
  LayoutList,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import type { MenuGroup } from '@/layouts/types';

export const studentMenu: MenuGroup[] = [
  {
    items: [
      { label: 'Trang chủ', icon: Home, path: '/student', roles: ['student'] },
      {
        label: 'Kế hoạch học tập',
        icon: LayoutList,
        roles: ['student'],
        children: [
          { label: 'Kế hoạch tuần', path: '/student/planning/weekly', roles: ['student'] },
          { label: 'Lịch ôn tập', path: '/student/planning/review', roles: ['student'] },
        ],
      },
      { label: 'Tài liệu & tri thức', icon: BookOpen, path: '/student/knowledge', roles: ['student'] },
      {
        label: 'Bài đánh giá',
        icon: LayoutList,
        roles: ['student'],
        children: [
          { label: 'Bài kiểm tra', path: '/student/assessment/tests', roles: ['student'] },
          { label: 'Kết quả', path: '/student/assessment/results', roles: ['student'] },
        ],
      },
      { label: 'Mức độ thành thạo', icon: TrendingUp, path: '/student/mastery', roles: ['student'] },
      { label: 'Cảnh báo rủi ro', icon: ShieldAlert, path: '/student/risk', roles: ['student'] },
      { label: 'Trợ lý AI', icon: Sparkles, path: '/student/ai-assist', roles: ['student'] },
      { label: 'Thông báo', icon: Bell, path: '/student/notifications', roles: ['student'] },
      { label: 'Hỗ trợ', icon: LifeBuoy, path: '/student/support', roles: ['student'] },
    ],
  },
  {
    label: 'Khác',
    items: [
      { label: 'Cài đặt', icon: Settings, path: '/student/settings', roles: ['student'] },
      { label: 'Đăng xuất', icon: LogOut, path: '/logout', roles: ['student'] },
    ],
  },
];
