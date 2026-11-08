import { useState } from 'react';
import { Button, Form, Select, Typography } from 'antd';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useAdminAiAssistLogList, useConceptOptions, useGenerateQuestionDraft } from './hooks/useAdminAiAssistItems';
import type { DraftQuestion, GenerateQuestionInput } from '@/services/ai-assist/types';

export default function AdminAiAssistItemsPage() {
  const { paging, setPage } = usePagedList();
  const { data, isLoading, error } = useAdminAiAssistLogList(paging);
  const { data: conceptData } = useConceptOptions();
  const generateMutation = useGenerateQuestionDraft();
  const errorMessage = useQueryErrorMessage(error);
  const [draft, setDraft] = useState<DraftQuestion | null>(null);

  if (isLoading) return <Loading />;

  return (
    <div>
      <PageHeader title="AI hỗ trợ sinh câu hỏi" />
      <Form
        layout="inline"
        style={{ marginBottom: 16 }}
        onFinish={(values: GenerateQuestionInput) =>
          generateMutation.mutate(values, { onSuccess: setDraft })
        }
      >
        <Form.Item name="concept" rules={[{ required: true }]}>
          <Select
            style={{ width: 240 }}
            placeholder="Chọn khái niệm"
            options={(conceptData?.data ?? []).map((c) => ({ value: c._id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="difficulty">
          <Select
            style={{ width: 140 }}
            placeholder="Độ khó"
            options={[
              { value: 'easy', label: 'Dễ' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'hard', label: 'Khó' },
            ]}
          />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" loading={generateMutation.isPending}>
            Sinh câu hỏi
          </Button>
        </Form.Item>
      </Form>

      {draft && (
        <Typography.Paragraph>
          <b>Gợi ý:</b> {draft.text} — sang trang Ngân hàng câu hỏi để chỉnh và lưu.
        </Typography.Paragraph>
      )}

      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <DataTable
        rowKey="_id"
        dataSource={data?.data ?? []}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Loại', dataIndex: 'kind' },
          { title: 'Yêu cầu', dataIndex: 'prompt', ellipsis: true },
          { title: 'Phản hồi AI', dataIndex: 'response', ellipsis: true },
          { title: 'Thời gian', dataIndex: 'createdAt' },
        ]}
      />
    </div>
  );
}
