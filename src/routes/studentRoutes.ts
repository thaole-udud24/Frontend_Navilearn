import { createElement } from 'react';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentComingSoon from '@/pages/student/ComingSoon';
import ExamLibraryPage from '@/pages/student/ExamLibrary';
import AssessmentPage from '@/pages/student/Assessment';
import MasteryPage from '@/pages/student/Mastery';
import AiAssistPage from '@/pages/student/AiAssist';
import PracticePage from '@/pages/student/Practice';
import PlannerPage from '@/pages/student/Planner';
import TemplateItemsPage from '@/pages/_template/Student';
import StudentAccountItemsPage from '@/pages/accounts/account/Student';
import StudentRiskItemsPage from '@/pages/planning/risk/Student';
import StudentSubjectItemsPage from '@/pages/accounts/subject/Student';
import StudentSupportItemsPage from '@/pages/ops/support/Student';
import AdminReportItemsStudentPage from '@/pages/ops/admin-report/Student';
import ReviewItemsStudentPage from '@/pages/content/review/Student';

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
  { path: 'planner', element: createElement(PlannerPage) },
  { path: 'resources', element: createElement(StudentComingSoon, { label: 'Tài liệu học tập' }) },
  { path: 'exam-library', element: createElement(ExamLibraryPage) },
  { path: 'course-resources', element: createElement(StudentComingSoon, { label: 'Tài nguyên khoá' }) },
  { path: 'ai-assist', element: createElement(AiAssistPage) },
  { path: 'notifications', element: createElement(StudentComingSoon, { label: 'Thông báo' }) },
  { path: 'settings', element: createElement(StudentAccountItemsPage) },
  { path: 'risk-items', element: createElement(StudentRiskItemsPage) },
  { path: 'subject-items', element: createElement(StudentSubjectItemsPage) },
  { path: 'support-items', element: createElement(StudentSupportItemsPage) },
  { path: 'report-issue', element: createElement(AdminReportItemsStudentPage) },
  { path: 'reviews', element: createElement(ReviewItemsStudentPage) },
];

// Kept as a live reference for scaffolding new modules the same way; not linked from the sidebar.
export const studentLegacyRoutes = [{ path: 'template-items', element: createElement(TemplateItemsPage) }];
