import { useState } from 'react';
import { Button, Form, Input, InputNumber, Select, Space } from 'antd';
import type { Concept } from '@/services/knowledge/types';
import type { Question } from '@/services/question-bank/types';
import type { CreateAssessmentConfigInput } from '@/services/assessment-config/types';

interface CreateItemFormProps {
  loading: boolean;
  concepts: Concept[];
  questions: Question[];
  onConceptChange: (conceptId: string) => void;
  onSubmit: (values: CreateAssessmentConfigInput) => void;
}

export function CreateItemForm({ loading, concepts, questions, onConceptChange, onSubmit }: CreateItemFormProps) {
  const [form] = Form.useForm<CreateAssessmentConfigInput>();
  const [conceptId, setConceptId] = useState<string>();

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ passScore: 50, timeLimitMinutes: 0 }}
      onFinish={(values) => {
        onSubmit(values);
        form.resetFields();
        setConceptId(undefined);
      }}
      style={{ marginBottom: 24, maxWidth: 600 }}
    >
      <Form.Item name="title" label="Tên đề bài" rules={[{ required: true }]}>
        <Input placeholder="Ví dụ: Kiểm tra Phương trình bậc 2" />
      </Form.Item>
      <Form.Item name="concept" label="Khái niệm" rules={[{ required: true }]}>
        <Select
          options={concepts.map((c) => ({ value: c._id, label: c.name }))}
          placeholder="Chọn khái niệm"
          onChange={(value: string) => {
            setConceptId(value);
            onConceptChange(value);
            form.setFieldValue('questions', []);
          }}
        />
      </Form.Item>
      <Form.Item name="questions" label="Câu hỏi" rules={[{ required: true, type: 'array', min: 1 }]}>
        <Select
          mode="multiple"
          disabled={!conceptId}
          options={questions.map((q) => ({ value: q._id, label: q.text }))}
          placeholder="Chọn câu hỏi thuộc khái niệm trên"
        />
      </Form.Item>
      <Space>
        <Form.Item name="passScore" label="Điểm đạt (%)">
          <InputNumber min={0} max={100} />
        </Form.Item>
        <Form.Item name="timeLimitMinutes" label="Thời gian (phút, 0 = không giới hạn)">
          <InputNumber min={0} />
        </Form.Item>
      </Space>
      <Button type="primary" htmlType="submit" loading={loading}>
        Tạo đề bài
      </Button>
    </Form>
  );
}
