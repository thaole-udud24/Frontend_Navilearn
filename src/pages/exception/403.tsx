import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

export default function Forbidden() {
  return (
    <Result
      status="403"
      title="403"
      subTitle="Bạn không có quyền truy cập trang này."
      extra={
        <Link to={PATHS.login}>
          <Button type="primary">Về trang đăng nhập</Button>
        </Link>
      }
    />
  );
}
