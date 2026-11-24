import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/DialogForm';
import type { DocumentMetaValues } from './documentUtils';

interface DocumentMetaFieldsProps {
  values: DocumentMetaValues;
  onChange: (values: DocumentMetaValues) => void;
}

/** Name, description, tags, important flag and chapter/topic/concept classification of a document. */
export function DocumentMetaFields({ values, onChange }: DocumentMetaFieldsProps) {
  const set = <K extends keyof DocumentMetaValues>(key: K, value: DocumentMetaValues[K]) =>
    onChange({ ...values, [key]: value });

  return (
    <div className="grid gap-4">
      <FormField label="Tên tài liệu">
        <Input value={values.name} maxLength={200} onChange={(e) => set('name', e.target.value)} />
      </FormField>
      <FormField label="Mô tả">
        <textarea
          className="min-h-20 rounded-control border border-input bg-card p-3 text-sm font-normal"
          maxLength={2000}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField label="Chương">
          <Input value={values.chapter} maxLength={200} onChange={(e) => set('chapter', e.target.value)} />
        </FormField>
        <FormField label="Chủ đề">
          <Input value={values.topic} maxLength={200} onChange={(e) => set('topic', e.target.value)} />
        </FormField>
        <FormField label="Khái niệm">
          <Input value={values.concept} maxLength={200} onChange={(e) => set('concept', e.target.value)} />
        </FormField>
      </div>
      <FormField label="Thẻ (cách nhau bằng dấu phẩy, tối đa 10)">
        <Input
          value={values.tagsText}
          placeholder="ôn thi, lý thuyết"
          onChange={(e) => set('tagsText', e.target.value)}
        />
      </FormField>
      <label className="flex items-center gap-2 text-sm font-medium">
        <Checkbox checked={values.important} onCheckedChange={(checked) => set('important', checked === true)} />
        Đánh dấu tài liệu quan trọng
      </label>
    </div>
  );
}
