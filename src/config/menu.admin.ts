import {
  Bell,
  Database,
  FileBarChart,
  Home,
  LayoutList,
  LifeBuoy,
  LogOut,
  Monitor,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

import type { MenuGroup } from '@/layouts/types';

export const adminMenu: MenuGroup[] = [
  {
    items: [
      { label: 'Trang chủ', icon: Home, path: '/admin', roles: ['admin'] },
      {
        label: 'Tài khoản & phân quyền',
        icon: Users,
        roles: ['admin'],
        children: [
          { label: 'Tài khoản', path: '/admin/accounts', roles: ['admin'] },
          { label: 'Vai trò', path: '/admin/roles', roles: ['admin'] },
        ],
      },
      { label: 'Kho tri thức', icon: LayoutList, path: '/admin/knowledge', roles: ['admin'] },
      { label: 'Ngân hàng câu hỏi', icon: LayoutList, path: '/admin/question-bank', roles: ['admin'] },
      { label: 'Bài đánh giá', icon: LayoutList, path: '/admin/assessment', roles: ['admin'] },
      {
        label: 'Cấu hình hệ thống',
        icon: ShieldCheck,
        roles: ['admin'],
        children: [
          { label: 'Quy tắc', path: '/admin/config/rules', roles: ['admin'] },
          { label: 'Ngưỡng cảnh báo', path: '/admin/config/thresholds', roles: ['admin'] },
        ],
      },
      { label: 'Giám sát', icon: Monitor, path: '/admin/monitoring', roles: ['admin'] },
      { label: 'Dữ liệu', icon: Database, path: '/admin/data', roles: ['admin'] },
      { label: 'Báo cáo', icon: FileBarChart, path: '/admin/reports', roles: ['admin'] },
      { label: 'Thông báo', icon: Bell, path: '/admin/notifications', roles: ['admin'] },
      { label: 'Hỗ trợ', icon: LifeBuoy, path: '/admin/support', roles: ['admin'] },
    ],
  },
  {
    label: 'Khác',
    items: [
      { label: 'Cài đặt', icon: Settings, path: '/admin/settings', roles: ['admin'] },
      { label: 'Đăng xuất', icon: LogOut, path: '/logout', roles: ['admin'] },
    ],
  },
];
