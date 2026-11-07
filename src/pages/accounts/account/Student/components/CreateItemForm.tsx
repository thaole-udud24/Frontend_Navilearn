import { Button, Form, Input } from 'antd';
import type { CreateAccountItemInput } from '@/services/account/types';

interface CreateItemFormProps {
  loading: boolean;
  onSubmit: (values: CreateAccountItemInput) => void;
}

export function CreateItemForm({ loading, onSubmit }: CreateItemFormProps) {
  const [form] = Form.useForm<CreateAccountItemInput>();

  return (
    <Form
      form={form}
      layout="inline"
      onFinish={(values) => {
        onSubmit(values);
        form.resetFields();
      }}
      style={{ marginBottom: 16 }}
    >
      <Form.Item name="title" rules={[{ required: true }]}>
        <Input placeholder="Tiêu đề" />
      </Form.Item>
      <Form.Item name="content" rules={[{ required: true }]}>
        <Input placeholder="Nội dung" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Gửi
        </Button>
      </Form.Item>
    </Form>
  );
}
