import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';

describe('parseCsv', () => {
  it('parses a simple header + rows into objects', () => {
    const rows = parseCsv('name,order\nĐại số,1\nHình học,2\n');
    expect(rows).toEqual([
      { name: 'Đại số', order: '1' },
      { name: 'Hình học', order: '2' },
    ]);
  });

  it('handles quoted fields with embedded commas and escaped quotes', () => {
    const rows = parseCsv('name,description\n"Đại số, cơ bản","Nói ""ngắn gọn"" thôi"\n');
    expect(rows).toEqual([{ name: 'Đại số, cơ bản', description: 'Nói "ngắn gọn" thôi' }]);
  });

  it('returns an empty array for blank input', () => {
    expect(parseCsv('')).toEqual([]);
  });
});

describe('toCsv', () => {
  it('quotes cells containing commas and starts with a UTF-8 BOM', () => {
    const csv = toCsv([{ name: 'A, B', count: 2 }], [
      { header: 'Tên', value: (r) => r.name },
      { header: 'Số lượng', value: (r) => r.count },
    ]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('"A, B",2');
  });
});
