import { Layout, Menu } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { useAuthStore } from '@/hooks/useAuth';

const { Header, Content, Sider } = Layout;

export function StudentLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu
          mode="inline"
          theme="dark"
          items={[
            { key: 'template-items', label: <Link to={PATHS.student.templateItems}>Template items</Link> },
            { key: 'account-items', label: <Link to={PATHS.student.accountItems}>Account items</Link> },
            { key: 'assessment-config-items', label: <Link to={PATHS.student.assessmentConfigItems}>Assessment config items</Link> },
            { key: 'adaptive-items', label: <Link to={PATHS.student.adaptiveItems}>Adaptive items</Link> },
            { key: 'ai-assist-items', label: <Link to={PATHS.student.aiAssistItems}>AI assist items</Link> },
            { key: 'ai-config-items', label: <Link to={PATHS.student.aiConfigItems}>AI config items</Link> },
            { key: 'admin-report-items', label: <Link to={PATHS.student.adminReportItems}>Admin report items</Link> },
            { key: 'assessment-items', label: <Link to={PATHS.student.assessmentItems}>Assessment items</Link> },
            { key: 'business-rule-items', label: <Link to={PATHS.student.businessRuleItems}>Business rule items</Link> },
            { key: 'data-retention-items', label: <Link to={PATHS.student.dataRetentionItems}>Data retention items</Link> },
            { key: 'knowledge-items', label: <Link to={PATHS.student.knowledgeItems}>Knowledge items</Link> },
            { key: 'monitoring-items', label: <Link to={PATHS.student.monitoringItems}>Monitoring items</Link> },
            { key: 'mastery-items', label: <Link to={PATHS.student.masteryItems}>Mastery items</Link> },
            { key: 'notification-items', label: <Link to={PATHS.student.notificationItems}>Notification items</Link> },
            { key: 'planning-items', label: <Link to={PATHS.student.planningItems}>Planning items</Link> },
            { key: 'question-bank-items', label: <Link to={PATHS.student.questionBankItems}>Question bank items</Link> },
            { key: 'rbac-items', label: <Link to={PATHS.student.rbacItems}>Rbac items</Link> },
            { key: 'review-items', label: <Link to={PATHS.student.reviewItems}>Review items</Link> },
            { key: 'report-items', label: <Link to={PATHS.student.reportItems}>Report items</Link> },
            { key: 'risk-items', label: <Link to={PATHS.student.riskItems}>Risk items</Link> },
            { key: 'subject-items', label: <Link to={PATHS.student.subjectItems}>Subject items</Link> },
            { key: 'support-items', label: <Link to={PATHS.student.supportItems}>Support items</Link> },
          ]}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', textAlign: 'right' }}>
          <a
            onClick={() => {
              logout();
              navigate(PATHS.login);
            }}
          >
            Đăng xuất
          </a>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
