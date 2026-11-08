import { useState } from 'react';
import { Button, Form, Input, InputNumber, Radio, Select, Space } from 'antd';
import { generateQuestionDraft } from '@/services/ai-assist';
import type { Concept } from '@/services/knowledge/types';
import type { CreateQuestionInput, QuestionType } from '@/services/question-bank/types';

interface CreateItemFormProps {
  loading: boolean;
  concepts: Concept[];
  onSubmit: (values: CreateQuestionInput) => void;
}

export function CreateItemForm({ loading, concepts, onSubmit }: CreateItemFormProps) {
  const [form] = Form.useForm<CreateQuestionInput>();
  const [generating, setGenerating] = useState(false);
  const type: QuestionType = Form.useWatch('type', form) ?? 'mcq';

  async function handleGenerateDraft() {
    const concept = form.getFieldValue('concept');
    if (!concept) return;
    setGenerating(true);
    try {
      const draft = await generateQuestionDraft({ concept });
      form.setFieldsValue({ type: 'mcq', text: draft.text, options: draft.options });
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ type: 'mcq', difficulty: 'medium', points: 10, options: [{ text: '' }, { text: '' }] }}
      onFinish={(values) => {
        onSubmit(values);
        form.resetFields();
      }}
      style={{ marginBottom: 24, maxWidth: 600 }}
    >
      <Form.Item name="concept" label="Khái niệm" rules={[{ required: true }]}>
        <Select
          options={concepts.map((c) => ({ value: c._id, label: c.name }))}
          placeholder="Chọn khái niệm"
        />
      </Form.Item>
      <Form.Item name="type" label="Loại câu hỏi">
        <Radio.Group options={[{ label: 'Trắc nghiệm', value: 'mcq' }, { label: 'Tự luận', value: 'essay' }]} />
      </Form.Item>
      <Form.Item name="text" label="Nội dung câu hỏi" rules={[{ required: true }]}>
        <Input.TextArea rows={2} />
      </Form.Item>

      {type === 'mcq' ? (
        <Form.List name="options">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field) => (
                <Space key={field.key} style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item name={[field.name, 'text']} rules={[{ required: true, message: 'Nhập nội dung' }]} noStyle>
                    <Input placeholder="Nội dung lựa chọn" style={{ width: 300 }} />
                  </Form.Item>
                  <Form.Item name={[field.name, 'isCorrect']} valuePropName="checked" noStyle>
                    <input type="checkbox" title="Đáp án đúng" />
                  </Form.Item>
                  <Button onClick={() => remove(field.name)}>Xoá</Button>
                </Space>
              ))}
              <Button onClick={() => add({ text: '' })} style={{ marginBottom: 16 }}>
                + Thêm lựa chọn
              </Button>
            </>
          )}
        </Form.List>
      ) : (
        <Form.Item name="referenceAnswer" label="Đáp án tham khảo (để AI chấm tự luận)">
          <Input.TextArea rows={2} />
        </Form.Item>
      )}

      <Space>
        <Form.Item name="difficulty" label="Độ khó">
          <Select
            options={[
              { value: 'easy', label: 'Dễ' },
              { value: 'medium', label: 'Trung bình' },
              { value: 'hard', label: 'Khó' },
            ]}
          />
        </Form.Item>
        <Form.Item name="points" label="Điểm">
          <InputNumber min={1} max={100} />
        </Form.Item>
      </Space>

      <Space>
        <Button onClick={handleGenerateDraft} loading={generating}>
          Gợi ý câu hỏi bằng AI
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Lưu câu hỏi
        </Button>
      </Space>
    </Form>
  );
}
