import { createElement } from 'react';
import StudentDashboard from '@/pages/student/Dashboard';
import TemplateItemsPage from '@/pages/_template/Student';
import StudentAccountItemsPage from '@/pages/accounts/account/Student';
import StudentRbacItemsPage from '@/pages/accounts/rbac/Student';
import StudentSubjectItemsPage from '@/pages/accounts/subject/Student';
import StudentKnowledgeItemsPage from '@/pages/content/knowledge/Student';
import StudentAssessmentItemsPage from '@/pages/content/assessment/Student';
import StudentQuestionBankItemsPage from '@/pages/content/question-bank/Student';
import StudentAssessmentConfigItemsPage from '@/pages/content/assessment-config/Student';
import StudentMasteryItemsPage from '@/pages/content/mastery/Student';
import StudentPlanningItemsPage from '@/pages/planning/planning/Student';
import StudentAdaptiveItemsPage from '@/pages/planning/adaptive/Student';
import StudentReviewItemsPage from '@/pages/planning/review/Student';
import StudentRiskItemsPage from '@/pages/planning/risk/Student';
import StudentAiAssistItemsPage from '@/pages/ai/ai-assist/Student';
import StudentAiConfigItemsPage from '@/pages/ai/ai-config/Student';
import StudentBusinessRuleItemsPage from '@/pages/ops/business-rule/Student';
import StudentMonitoringItemsPage from '@/pages/ops/monitoring/Student';
import StudentDataRetentionItemsPage from '@/pages/ops/data-retention/Student';
import StudentReportItemsPage from '@/pages/ops/report/Student';
import StudentAdminReportItemsPage from '@/pages/ops/admin-report/Student';
import StudentNotificationItemsPage from '@/pages/ops/notification/Student';
import StudentSupportItemsPage from '@/pages/ops/support/Student';

export const studentRoutes = [
  { index: true, element: createElement(StudentDashboard) },
  { path: 'template-items', element: createElement(TemplateItemsPage) },
  { path: 'account-items', element: createElement(StudentAccountItemsPage) },
  { path: 'rbac-items', element: createElement(StudentRbacItemsPage) },
  { path: 'subject-items', element: createElement(StudentSubjectItemsPage) },
  { path: 'knowledge-items', element: createElement(StudentKnowledgeItemsPage) },
  { path: 'assessment-items', element: createElement(StudentAssessmentItemsPage) },
  { path: 'question-bank-items', element: createElement(StudentQuestionBankItemsPage) },
  { path: 'assessment-config-items', element: createElement(StudentAssessmentConfigItemsPage) },
  { path: 'mastery-items', element: createElement(StudentMasteryItemsPage) },
  { path: 'planning-items', element: createElement(StudentPlanningItemsPage) },
  { path: 'adaptive-items', element: createElement(StudentAdaptiveItemsPage) },
  { path: 'review-items', element: createElement(StudentReviewItemsPage) },
  { path: 'risk-items', element: createElement(StudentRiskItemsPage) },
  { path: 'ai-assist-items', element: createElement(StudentAiAssistItemsPage) },
  { path: 'ai-config-items', element: createElement(StudentAiConfigItemsPage) },
  { path: 'business-rule-items', element: createElement(StudentBusinessRuleItemsPage) },
  { path: 'monitoring-items', element: createElement(StudentMonitoringItemsPage) },
  { path: 'data-retention-items', element: createElement(StudentDataRetentionItemsPage) },
  { path: 'report-items', element: createElement(StudentReportItemsPage) },
  { path: 'admin-report-items', element: createElement(StudentAdminReportItemsPage) },
  { path: 'notification-items', element: createElement(StudentNotificationItemsPage) },
  { path: 'support-items', element: createElement(StudentSupportItemsPage) },
];
