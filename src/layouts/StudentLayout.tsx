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
