import { createElement } from 'react';
import StudentDashboard from '@/pages/student/Dashboard';
import StudentComingSoon from '@/pages/student/ComingSoon';
import CoursesPage from '@/pages/student/Courses';
import KnowledgeMapPage from '@/pages/student/KnowledgeMap';
import ExamLibraryPage from '@/pages/student/ExamLibrary';
import AssessmentPage from '@/pages/student/Assessment';
import MasteryPage from '@/pages/student/Mastery';
import AiAssistPage from '@/pages/student/AiAssist';
import PracticePage from '@/pages/student/Practice';
import PlannerPage from '@/pages/student/Planner';
import ResourcesPage from '@/pages/student/Resources';
import CourseResourcesPage from '@/pages/student/CourseResources';
import LearningRoadmapPage from '@/pages/student/LearningRoadmap';
import TemplateItemsPage from '@/pages/_template/Student';
import StudentAccountItemsPage from '@/pages/accounts/account/Student';
import StudentRiskItemsPage from '@/pages/planning/risk/Student';
import StudentProfilePage from '@/pages/accounts/account/Student/Profile';
import StudentChangePasswordPage from '@/pages/accounts/account/Student/ChangePassword';
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
  { path: 'courses', element: createElement(CoursesPage) },
  { path: 'learning-roadmap', element: createElement(LearningRoadmapPage) },
  { path: 'knowledge-map', element: createElement(KnowledgeMapPage) },
  { path: 'practice', element: createElement(PracticePage) },
  { path: 'assessment', element: createElement(AssessmentPage) },
  { path: 'mastery', element: createElement(MasteryPage) },
  { path: 'planner', element: createElement(PlannerPage) },
  { path: 'resources', element: createElement(ResourcesPage) },
  { path: 'exam-library', element: createElement(ExamLibraryPage) },
  { path: 'course-resources', element: createElement(CourseResourcesPage) },
  { path: 'ai-assist', element: createElement(AiAssistPage) },
  { path: 'notifications', element: createElement(StudentComingSoon, { label: 'Thông báo' }) },
  { path: 'settings', element: createElement(StudentAccountItemsPage) },
  { path: 'risk-items', element: createElement(StudentRiskItemsPage) },
  { path: 'support-items', element: createElement(StudentSupportItemsPage) },
  { path: 'report-issue', element: createElement(AdminReportItemsStudentPage) },
  { path: 'reviews', element: createElement(ReviewItemsStudentPage) },
];

// Pages that only provide their content: StudentAppShellLayout supplies the sidebar, header and sign-out.
export const studentShellRoutes = [
  { path: 'profile', element: createElement(StudentProfilePage) },
  { path: 'change-password', element: createElement(StudentChangePasswordPage) },
];

// Kept as a live reference for scaffolding new modules the same way; not linked from the sidebar.
export const studentLegacyRoutes = [{ path: 'template-items', element: createElement(TemplateItemsPage) }];
