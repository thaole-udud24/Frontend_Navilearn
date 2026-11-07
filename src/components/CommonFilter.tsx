import type { ReactNode } from 'react';
import { Space } from 'antd';

interface CommonFilterProps {
  children: ReactNode;
}

// Layout shell for filter controls; the controls themselves are passed in as children by the page.
export function CommonFilter({ children }: CommonFilterProps) {
  return (
    <Space wrap style={{ marginBottom: 16 }}>
      {children}
    </Space>
  );
}
