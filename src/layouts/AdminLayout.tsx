import { Layout, Menu } from 'antd';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { PATHS } from '@/routes/paths';
import { useAuthStore } from '@/hooks/useAuth';

const { Header, Content, Sider } = Layout;

export function AdminLayout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <Menu
          mode="inline"
          theme="dark"
          items={[
            { key: 'template-items', label: <Link to={PATHS.admin.templateItems}>Template items</Link> },
            { key: 'account-items', label: <Link to={PATHS.admin.accountItems}>Account items</Link> },
            { key: 'assessment-config-items', label: <Link to={PATHS.admin.assessmentConfigItems}>Assessment config items</Link> },
            { key: 'adaptive-items', label: <Link to={PATHS.admin.adaptiveItems}>Adaptive items</Link> },
            { key: 'ai-assist-items', label: <Link to={PATHS.admin.aiAssistItems}>AI assist items</Link> },
            { key: 'ai-config-items', label: <Link to={PATHS.admin.aiConfigItems}>AI config items</Link> },
            { key: 'admin-report-items', label: <Link to={PATHS.admin.adminReportItems}>Admin report items</Link> },
            { key: 'assessment-items', label: <Link to={PATHS.admin.assessmentItems}>Assessment items</Link> },
            { key: 'business-rule-items', label: <Link to={PATHS.admin.businessRuleItems}>Business rule items</Link> },
            { key: 'data-retention-items', label: <Link to={PATHS.admin.dataRetentionItems}>Data retention items</Link> },
            { key: 'knowledge-items', label: <Link to={PATHS.admin.knowledgeItems}>Knowledge items</Link> },
            { key: 'monitoring-items', label: <Link to={PATHS.admin.monitoringItems}>Monitoring items</Link> },
            { key: 'mastery-items', label: <Link to={PATHS.admin.masteryItems}>Mastery items</Link> },
            { key: 'notification-items', label: <Link to={PATHS.admin.notificationItems}>Notification items</Link> },
            { key: 'planning-items', label: <Link to={PATHS.admin.planningItems}>Planning items</Link> },
            { key: 'question-bank-items', label: <Link to={PATHS.admin.questionBankItems}>Question bank items</Link> },
            { key: 'rbac-items', label: <Link to={PATHS.admin.rbacItems}>Rbac items</Link> },
            { key: 'review-items', label: <Link to={PATHS.admin.reviewItems}>Review items</Link> },
            { key: 'report-items', label: <Link to={PATHS.admin.reportItems}>Report items</Link> },
            { key: 'risk-items', label: <Link to={PATHS.admin.riskItems}>Risk items</Link> },
            { key: 'subject-items', label: <Link to={PATHS.admin.subjectItems}>Subject items</Link> },
            { key: 'support-items', label: <Link to={PATHS.admin.supportItems}>Support items</Link> },
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
