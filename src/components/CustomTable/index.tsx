import { Table, type TableProps } from 'antd';
import type { ApiMeta } from '@/types/api.d';

interface DataTableProps<T> extends Omit<TableProps<T>, 'pagination' | 'rowKey'> {
  rowKey: string;
  meta?: ApiMeta;
  onPageChange?: (page: number, limit: number) => void;
}

// Pure presentational: receives data/props, never calls an API itself.
export function DataTable<T extends object>({ meta, onPageChange, ...tableProps }: DataTableProps<T>) {
  return (
    <Table<T>
      {...tableProps}
      pagination={
        meta
          ? {
              current: meta.page,
              pageSize: meta.limit,
              total: meta.total,
              onChange: onPageChange,
            }
          : false
      }
    />
  );
}
