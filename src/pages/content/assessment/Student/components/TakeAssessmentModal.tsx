import { Form, Input, Modal, Radio } from 'antd';
import { Loading } from '@/components/Loading';
import { useAssessmentQuestions, useSubmitAssessment } from '../hooks/useAssessmentItems';
import type { SubmitAssessmentInput } from '@/services/assessment/types';

interface TakeAssessmentModalProps {
  assessmentId: string;
  assessmentConfigId: string;
  onClose: () => void;
}

export function TakeAssessmentModal({ assessmentId, assessmentConfigId, onClose }: TakeAssessmentModalProps) {
  const { data, isLoading } = useAssessmentQuestions(assessmentConfigId);
  const submitMutation = useSubmitAssessment();
  const [form] = Form.useForm<Record<string, string>>();

  function handleSubmit(values: Record<string, string>) {
    if (!data) return;
    const input: SubmitAssessmentInput = {
      answers: data.questions.map((q) => {
        const raw = values[q._id];
        return q.type === 'mcq'
          ? { question: q._id, selectedOptionIndex: raw === undefined ? undefined : Number(raw) }
          : { question: q._id, essayText: raw };
      }),
    };
    submitMutation.mutate({ id: assessmentId, input }, { onSuccess: onClose });
  }

  return (
    <Modal open title="Làm bài" onCancel={onClose} onOk={() => form.submit()} okButtonProps={{ loading: submitMutation.isPending }}>
      {isLoading || !data ? (
        <Loading />
      ) : (
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {data.questions.map((q, index) => (
            <Form.Item key={q._id} name={q._id} label={`Câu ${index + 1}: ${q.text}`} rules={[{ required: true, message: 'Vui lòng trả lời' }]}>
              {q.type === 'mcq' ? (
                <Radio.Group options={q.options.map((o, i) => ({ value: String(i), label: o.text }))} />
              ) : (
                <Input.TextArea rows={3} />
              )}
            </Form.Item>
          ))}
        </Form>
      )}
    </Modal>
  );
}
