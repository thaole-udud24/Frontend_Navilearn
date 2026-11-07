import { Result, Button } from 'antd';
import { Link } from 'react-router-dom';
import { PATHS } from '@/routes/paths';

export default function NotFound() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="Trang bạn tìm không tồn tại."
      extra={
        <Link to={PATHS.login}>
          <Button type="primary">Về trang đăng nhập</Button>
        </Link>
      }
    />
  );
}
