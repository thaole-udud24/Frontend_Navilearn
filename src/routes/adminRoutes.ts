import { createElement } from 'react';
import AdminDashboard from '@/pages/admin/Dashboard';
import QuestionBankAdmin from '@/pages/admin/QuestionBankAdmin';
import IssueReportsAdmin from '@/pages/admin/IssueReportsAdmin';
import AssessmentConfigAdmin from '@/pages/admin/AssessmentConfigAdmin';
import RubricAdmin from '@/pages/admin/RubricAdmin';
import TemplateItemsPage from '@/pages/_template/Admin';
import AdminAccountItemsPage from '@/pages/accounts/account/Admin';
import AdminRbacItemsPage from '@/pages/accounts/rbac/Admin';
import AdminSubjectItemsPage from '@/pages/accounts/subject/Admin';
import AdminKnowledgeItemsPage from '@/pages/content/knowledge/Admin';
import AdminRiskItemsPage from '@/pages/planning/risk/Admin';
import AdminMonitoringItemsPage from '@/pages/ops/monitoring/Admin';
import AdminDataRetentionItemsPage from '@/pages/ops/data-retention/Admin';
import AdminReportItemsPage from '@/pages/ops/report/Admin';
import AdminNotificationItemsPage from '@/pages/ops/notification/Admin';
import AdminSupportItemsPage from '@/pages/ops/support/Admin';
import BusinessRuleAdmin from '@/pages/admin/BusinessRuleAdmin';
import AdminReportItemsAdminPage from '@/pages/ops/admin-report/Admin';
import ReviewItemsAdminPage from '@/pages/content/review/Admin';
import PlanTemplateAdmin from '@/pages/admin/PlanTemplateAdmin';
import LessonAdmin from '@/pages/admin/LessonAdmin';
import FlashcardAdmin from '@/pages/admin/FlashcardAdmin';
import AssetAdmin from '@/pages/admin/AssetAdmin';

// The dashboard and the new QBK/ACF screens bring their own full AppShell (dark-navy sidebar +
// header), so they must render as AdminLayout siblings, not nested inside its antd Sider — same
// pattern as routes/studentRoutes.ts.
export const adminIndexRoute = { index: true, element: createElement(AdminDashboard) };

export const adminNewRoutes = [
  { path: 'account-items', element: createElement(AdminAccountItemsPage) },
  { path: 'questions', element: createElement(QuestionBankAdmin) },
  { path: 'questions/issue-reports', element: createElement(IssueReportsAdmin) },
  { path: 'exam-configs', element: createElement(AssessmentConfigAdmin) },
  { path: 'exam-configs/rubrics', element: createElement(RubricAdmin) },
  { path: 'business-rule-items', element: createElement(BusinessRuleAdmin) },
  { path: 'subject-items', element: createElement(AdminSubjectItemsPage) },
  { path: 'knowledge-items', element: createElement(AdminKnowledgeItemsPage) },
  { path: 'risk-items', element: createElement(AdminRiskItemsPage) },
  { path: 'monitoring-items', element: createElement(AdminMonitoringItemsPage) },
  { path: 'data-retention-items', element: createElement(AdminDataRetentionItemsPage) },
  { path: 'report-items', element: createElement(AdminReportItemsPage) },
  { path: 'notification-items', element: createElement(AdminNotificationItemsPage) },
  { path: 'support-items', element: createElement(AdminSupportItemsPage) },
  { path: 'admin-report-items', element: createElement(AdminReportItemsAdminPage) },
  { path: 'review-items', element: createElement(ReviewItemsAdminPage) },
  { path: 'plan-template-items', element: createElement(PlanTemplateAdmin) },
  { path: 'lesson-items', element: createElement(LessonAdmin) },
  { path: 'flashcard-items', element: createElement(FlashcardAdmin) },
  { path: 'asset-items', element: createElement(AssetAdmin) },
];

// Kept as a live reference for scaffolding new modules the same way (see backend routes/index.js);
// not linked from the sidebar.
export const adminLegacyRoutes = [
  { path: 'template-items', element: createElement(TemplateItemsPage) },
  { path: 'rbac-items', element: createElement(AdminRbacItemsPage) },
];
