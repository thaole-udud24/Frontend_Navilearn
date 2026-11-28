import {
  Bell,
  BookMarked,
  Database,
  FileBarChart,
  FileCheck2,
  FileText,
  Home,
  LayoutList,
  LayoutTemplate,
  LifeBuoy,
  ListChecks,
  Monitor,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

import type { MenuGroup } from '@/layouts/types';
import { PATHS } from '@/routes/paths';

export const adminMenu: MenuGroup[] = [
  {
    items: [{ label: 'Trang chủ', icon: Home, path: PATHS.admin.root, roles: ['admin'] }],
  },
  {
    label: 'Nội dung học',
    items: [
      { label: 'Môn học', icon: Settings, path: PATHS.admin.subjectCatalog, roles: ['admin'] },
      { label: 'Kho tri thức', icon: LayoutList, path: PATHS.admin.knowledgeItems, roles: ['admin'] },
      { label: 'Tài liệu nguồn', icon: FileText, path: PATHS.admin.assetItems, roles: ['admin'] },
      {
        label: 'Ngân hàng nội dung',
        icon: BookMarked,
        roles: ['admin'],
        children: [
          { label: 'Câu hỏi', path: PATHS.admin.questions, roles: ['admin'] },
          { label: 'Thẻ ghi nhớ', path: PATHS.admin.flashcardItems, roles: ['admin'] },
          { label: 'Báo lỗi từ sinh viên', path: PATHS.admin.questionIssueReports, roles: ['admin'] },
        ],
      },
      {
        label: 'Lộ trình mẫu',
        icon: LayoutTemplate,
        roles: ['admin'],
        children: [
          { label: 'Lộ trình', path: PATHS.admin.planTemplateItems, roles: ['admin'] },
          { label: 'Thư viện bài học', path: PATHS.admin.lessonItems, roles: ['admin'] },
        ],
      },
    ],
  },
  {
    label: 'Đánh giá',
    items: [
      { label: 'Cấu hình đề bài', icon: ListChecks, path: PATHS.admin.examConfigs, roles: ['admin'] },
      { label: 'Rubric chấm tự luận', icon: FileCheck2, path: PATHS.admin.rubrics, roles: ['admin'] },
    ],
  },
  {
    label: 'Người học và vận hành',
    items: [
      { label: 'Giám sát', icon: Monitor, path: PATHS.admin.monitoringItems, roles: ['admin'] },
      { label: 'Báo cáo', icon: FileBarChart, path: PATHS.admin.reportItems, roles: ['admin'] },
      { label: 'Dữ liệu', icon: Database, path: PATHS.admin.dataRetentionItems, roles: ['admin'] },
      { label: 'Thông báo', icon: Bell, path: PATHS.admin.notificationItems, roles: ['admin'] },
      {
        label: 'Hỗ trợ',
        icon: LifeBuoy,
        roles: ['admin'],
        children: [
          { label: 'Yêu cầu hỗ trợ', path: PATHS.admin.supportItems, roles: ['admin'] },
          { label: 'Sự cố từ sinh viên', path: PATHS.admin.adminReportItems, roles: ['admin'] },
          { label: 'Đánh giá từ sinh viên', path: PATHS.admin.reviewItems, roles: ['admin'] },
        ],
      },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      {
        label: 'Tài khoản và phân quyền',
        icon: Users,
        roles: ['admin'],
        children: [
          { label: 'Tài khoản', path: PATHS.admin.accountItems, roles: ['admin'] },
          { label: 'Vai trò', path: PATHS.admin.rbacItems, roles: ['admin'] },
        ],
      },
      {
        label: 'Cấu hình hệ thống',
        icon: ShieldCheck,
        roles: ['admin'],
        children: [
          { label: 'Quy tắc', path: PATHS.admin.businessRuleItems, roles: ['admin'] },
          { label: 'Ngưỡng cảnh báo', path: PATHS.admin.riskItems, roles: ['admin'] },
        ],
      },
    ],
  },
];
