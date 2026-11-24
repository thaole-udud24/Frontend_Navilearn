import { describe, expect, it } from 'vitest';
import {
  formatFileSize,
  parseCsv,
  parseManifestCsv,
  parseTags,
  validateDocumentFile,
} from './documentUtils';

describe('validateDocumentFile', () => {
  it('accepts pdf and docx up to 20 MB, case-insensitively', () => {
    expect(validateDocumentFile({ name: 'a.PDF', size: 100 })).toBeNull();
    expect(validateDocumentFile({ name: 'b.docx', size: 20 * 1024 * 1024 })).toBeNull();
  });

  it('rejects other types, oversize and empty files', () => {
    expect(validateDocumentFile({ name: 'a.txt', size: 100 })).toMatch(/PDF hoặc DOCX/);
    expect(validateDocumentFile({ name: 'a.pdf', size: 20 * 1024 * 1024 + 1 })).toMatch(/20 MB/);
    expect(validateDocumentFile({ name: 'a.pdf', size: 0 })).toMatch(/rỗng/);
  });
});

describe('parseTags', () => {
  it('splits on comma and semicolon, trims and removes duplicates', () => {
    expect(parseTags(' ôn thi, lý thuyết ;ôn thi,, ')).toEqual(['ôn thi', 'lý thuyết']);
    expect(parseTags('')).toEqual([]);
  });
});

describe('formatFileSize', () => {
  it('uses the largest sensible unit', () => {
    expect(formatFileSize(512)).toBe('512 B');
    expect(formatFileSize(2048)).toBe('2.0 KB');
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('parseCsv', () => {
  it('handles quotes, escaped quotes, commas in cells, CRLF and a BOM', () => {
    const bom = String.fromCharCode(0xfeff);
    const text = [`${bom}a,b`, '"x, y","say ""hi"""', '', 'last,row'].join('\r\n');
    expect(parseCsv(text)).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
      ['last', 'row'],
    ]);
  });

  it('keeps newlines inside quoted cells', () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([['a'], ['line1\nline2']]);
  });
});

describe('parseManifestCsv', () => {
  it('maps columns by header name and ignores empty cells', () => {
    const csv = 'File,Name,Tags,Important,Chapter\nde-cuong.pdf,Đề cương,"a; b",có,Chương 1\nbai-tap.docx,,,,\n';
    const { rows, error } = parseManifestCsv(csv);
    expect(error).toBeNull();
    expect(rows).toEqual([
      { file: 'de-cuong.pdf', name: 'Đề cương', tags: ['a', 'b'], important: true, chapter: 'Chương 1' },
      { file: 'bai-tap.docx' },
    ]);
  });

  it('requires a file column and skips rows without a file name', () => {
    expect(parseManifestCsv('name\nx').error).toMatch(/cột "file"/);
    expect(parseManifestCsv('file,name\n,orphan\na.pdf,A').rows).toEqual([{ file: 'a.pdf', name: 'A' }]);
    expect(parseManifestCsv('').error).toMatch(/trống/);
  });
});
