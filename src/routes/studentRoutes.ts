import { createElement } from 'react';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentComingSoon from '@/pages/student/ComingSoon';
import ExamLibraryPage from '@/pages/student/ExamLibrary';
import AssessmentPage from '@/pages/student/Assessment';
import MasteryPage from '@/pages/student/Mastery';
import AiAssistPage from '@/pages/student/AiAssist';
import PracticePage from '@/pages/student/Practice';
import TemplateItemsPage from '@/pages/_template/Student';
import StudentAccountItemsPage from '@/pages/accounts/account/Student';
import StudentRbacItemsPage from '@/pages/accounts/rbac/Student';
import StudentSubjectItemsPage from '@/pages/accounts/subject/Student';
import StudentKnowledgeItemsPage from '@/pages/content/knowledge/Student';
import StudentPlanningItemsPage from '@/pages/planning/planning/Student';
import StudentAdaptiveItemsPage from '@/pages/planning/adaptive/Student';
import StudentReviewItemsPage from '@/pages/planning/review/Student';
import StudentRiskItemsPage from '@/pages/planning/risk/Student';
import StudentAiConfigItemsPage from '@/pages/ai/ai-config/Student';
import StudentBusinessRuleItemsPage from '@/pages/ops/business-rule/Student';
import StudentMonitoringItemsPage from '@/pages/ops/monitoring/Student';
import StudentDataRetentionItemsPage from '@/pages/ops/data-retention/Student';
import StudentReportItemsPage from '@/pages/ops/report/Student';
import StudentAdminReportItemsPage from '@/pages/ops/admin-report/Student';
import StudentNotificationItemsPage from '@/pages/ops/notification/Student';
import StudentSupportItemsPage from '@/pages/ops/support/Student';

// The real dashboard brings its own full AppShell (sidebar + header), so it must render as a
// sibling of StudentLayout, not nested inside its antd Sider — see routes/index.tsx.
export const studentIndexRoute = { index: true, element: createElement(StudentDashboard) };

// Sidebar links whose real feature isn't built yet. These also render as AppShell siblings (not
// under the legacy StudentLayout) so clicking them stays on the new design instead of jumping to
// the old antd shell. Swap each entry for its real page, under the same path, once it ships.
export const studentComingSoonRoutes = [
  { path: 'courses', element: createElement(StudentComingSoon, { label: 'Khoá học của tôi' }) },
  { path: 'knowledge-map', element: createElement(StudentComingSoon, { label: 'Bản đồ tri thức' }) },
  { path: 'practice', element: createElement(PracticePage) },
  { path: 'assessment', element: createElement(AssessmentPage) },
  { path: 'mastery', element: createElement(MasteryPage) },
  { path: 'planner', element: createElement(StudentComingSoon, { label: 'Lộ kế hoạch học tập' }) },
  { path: 'resources', element: createElement(StudentComingSoon, { label: 'Tài liệu học tập' }) },
  { path: 'exam-library', element: createElement(ExamLibraryPage) },
  { path: 'course-resources', element: createElement(StudentComingSoon, { label: 'Tài nguyên khoá' }) },
  { path: 'ai-assist', element: createElement(AiAssistPage) },
  { path: 'notifications', element: createElement(StudentComingSoon, { label: 'Thông báo' }) },
  { path: 'settings', element: createElement(StudentAccountItemsPage) },
];

// Legacy CRUD-scaffold pages: bare content, they rely on StudentLayout for navigation/chrome.
export const studentLegacyRoutes = [
  { path: 'template-items', element: createElement(TemplateItemsPage) },
  { path: 'account-items', element: createElement(StudentAccountItemsPage) },
  { path: 'rbac-items', element: createElement(StudentRbacItemsPage) },
  { path: 'subject-items', element: createElement(StudentSubjectItemsPage) },
  { path: 'knowledge-items', element: createElement(StudentKnowledgeItemsPage) },
  { path: 'planning-items', element: createElement(StudentPlanningItemsPage) },
  { path: 'adaptive-items', element: createElement(StudentAdaptiveItemsPage) },
  { path: 'review-items', element: createElement(StudentReviewItemsPage) },
  { path: 'risk-items', element: createElement(StudentRiskItemsPage) },
  { path: 'ai-config-items', element: createElement(StudentAiConfigItemsPage) },
  { path: 'business-rule-items', element: createElement(StudentBusinessRuleItemsPage) },
  { path: 'monitoring-items', element: createElement(StudentMonitoringItemsPage) },
  { path: 'data-retention-items', element: createElement(StudentDataRetentionItemsPage) },
  { path: 'report-items', element: createElement(StudentReportItemsPage) },
  { path: 'admin-report-items', element: createElement(StudentAdminReportItemsPage) },
  { path: 'notification-items', element: createElement(StudentNotificationItemsPage) },
  { path: 'support-items', element: createElement(StudentSupportItemsPage) },
];
