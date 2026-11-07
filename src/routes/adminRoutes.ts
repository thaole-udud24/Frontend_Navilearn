import { createElement } from 'react';
import AdminDashboard from '@/pages/admin/Dashboard';
import TemplateItemsPage from '@/pages/_template/Admin';
import AdminAccountItemsPage from '@/pages/accounts/account/Admin';
import AdminRbacItemsPage from '@/pages/accounts/rbac/Admin';
import AdminSubjectItemsPage from '@/pages/accounts/subject/Admin';
import AdminKnowledgeItemsPage from '@/pages/content/knowledge/Admin';
import AdminAssessmentItemsPage from '@/pages/content/assessment/Admin';
import AdminQuestionBankItemsPage from '@/pages/content/question-bank/Admin';
import AdminAssessmentConfigItemsPage from '@/pages/content/assessment-config/Admin';
import AdminMasteryItemsPage from '@/pages/content/mastery/Admin';
import AdminPlanningItemsPage from '@/pages/planning/planning/Admin';
import AdminAdaptiveItemsPage from '@/pages/planning/adaptive/Admin';
import AdminReviewItemsPage from '@/pages/planning/review/Admin';
import AdminRiskItemsPage from '@/pages/planning/risk/Admin';
import AdminAiAssistItemsPage from '@/pages/ai/ai-assist/Admin';
import AdminAiConfigItemsPage from '@/pages/ai/ai-config/Admin';
import AdminBusinessRuleItemsPage from '@/pages/ops/business-rule/Admin';
import AdminMonitoringItemsPage from '@/pages/ops/monitoring/Admin';
import AdminDataRetentionItemsPage from '@/pages/ops/data-retention/Admin';
import AdminReportItemsPage from '@/pages/ops/report/Admin';
import AdminAdminReportItemsPage from '@/pages/ops/admin-report/Admin';
import AdminNotificationItemsPage from '@/pages/ops/notification/Admin';
import AdminSupportItemsPage from '@/pages/ops/support/Admin';

export const adminRoutes = [
  { index: true, element: createElement(AdminDashboard) },
  { path: 'template-items', element: createElement(TemplateItemsPage) },
  { path: 'account-items', element: createElement(AdminAccountItemsPage) },
  { path: 'rbac-items', element: createElement(AdminRbacItemsPage) },
  { path: 'subject-items', element: createElement(AdminSubjectItemsPage) },
  { path: 'knowledge-items', element: createElement(AdminKnowledgeItemsPage) },
  { path: 'assessment-items', element: createElement(AdminAssessmentItemsPage) },
  { path: 'question-bank-items', element: createElement(AdminQuestionBankItemsPage) },
  { path: 'assessment-config-items', element: createElement(AdminAssessmentConfigItemsPage) },
  { path: 'mastery-items', element: createElement(AdminMasteryItemsPage) },
  { path: 'planning-items', element: createElement(AdminPlanningItemsPage) },
  { path: 'adaptive-items', element: createElement(AdminAdaptiveItemsPage) },
  { path: 'review-items', element: createElement(AdminReviewItemsPage) },
  { path: 'risk-items', element: createElement(AdminRiskItemsPage) },
  { path: 'ai-assist-items', element: createElement(AdminAiAssistItemsPage) },
  { path: 'ai-config-items', element: createElement(AdminAiConfigItemsPage) },
  { path: 'business-rule-items', element: createElement(AdminBusinessRuleItemsPage) },
  { path: 'monitoring-items', element: createElement(AdminMonitoringItemsPage) },
  { path: 'data-retention-items', element: createElement(AdminDataRetentionItemsPage) },
  { path: 'report-items', element: createElement(AdminReportItemsPage) },
  { path: 'admin-report-items', element: createElement(AdminAdminReportItemsPage) },
  { path: 'notification-items', element: createElement(AdminNotificationItemsPage) },
  { path: 'support-items', element: createElement(AdminSupportItemsPage) },
];
