import { useRef } from 'react';
import { FileUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DOCUMENT_ACCEPT, formatFileSize } from './documentUtils';

interface FilePickerProps {
  files: File[];
  multiple?: boolean;
  onPick: (files: File[]) => void;
  error?: string | null;
}

/** PDF/DOCX chooser. Validation lives in the caller so single and multiple pickers can share it. */
export function FilePicker({ files, multiple, onPick, error }: FilePickerProps) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <input
        ref={input}
        type="file"
        className="hidden"
        multiple={multiple}
        accept={DOCUMENT_ACCEPT}
        onChange={(e) => {
          onPick(Array.from(e.target.files ?? []));
          e.target.value = '';
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" onClick={() => input.current?.click()}>
          <FileUp />
          {multiple ? 'Chọn các tệp' : 'Chọn tệp'}
        </Button>
        <span className="text-xs font-normal text-muted-foreground">PDF hoặc DOCX, tối đa 20 MB mỗi tệp</span>
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm font-normal">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex justify-between gap-3 rounded-control bg-muted px-3 py-1.5"
            >
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm font-normal text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
