import { Button, Form, Input, InputNumber, Popconfirm, Tag } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminConceptList, useArchiveConcept, useCreateConcept } from './hooks/useAdminKnowledgeItems';
import type { Concept, CreateConceptInput } from '@/services/knowledge/types';

export default function AdminKnowledgeItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAdminConceptList(paging);
  const createMutation = useCreateConcept();
  const archiveMutation = useArchiveConcept();
  const errorMessage = useQueryErrorMessage(error);
  const [form] = Form.useForm<CreateConceptInput>();

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="Quản lý khái niệm (Concept)" />
      <Form
        form={form}
        layout="inline"
        onFinish={(values) => {
          createMutation.mutate(values);
          form.resetFields();
        }}
        style={{ marginBottom: 16 }}
      >
        <Form.Item name="name" rules={[{ required: true }]}>
          <Input placeholder="Tên khái niệm" />
        </Form.Item>
        <Form.Item name="description">
          <Input placeholder="Mô tả" />
        </Form.Item>
        <Form.Item name="order">
          <InputNumber placeholder="Thứ tự" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={createMutation.isPending}>
            Thêm khái niệm
          </Button>
        </Form.Item>
      </Form>
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable<Concept>
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Tên khái niệm', dataIndex: 'name' },
          { title: 'Mô tả', dataIndex: 'description' },
          { title: 'Thứ tự', dataIndex: 'order' },
          { title: 'Trạng thái', dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
          {
            title: 'Hành động',
            render: (_, record) =>
              record.status === 'active' && (
                <Popconfirm title="Lưu trữ khái niệm này?" onConfirm={() => archiveMutation.mutate(record._id)}>
                  <Button size="small" danger>
                    Lưu trữ
                  </Button>
                </Popconfirm>
              ),
          },
        ]}
      />
    </div>
  );
}
