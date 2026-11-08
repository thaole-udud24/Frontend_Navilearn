import { Tag } from 'antd';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PageHeader } from '@/components/PageHeader';
import { DataTable } from '@/components/CustomTable';
import { Loading } from '@/components/Loading';
import { usePagedList } from '@/hooks/usePagedList';
import { useQueryErrorMessage } from '@/hooks/useQueryErrorMessage';
import { useMasteryList } from './hooks/useMasteryItems';
import type { Mastery } from '@/services/mastery/types';

const LEVEL_LABEL: Record<Mastery['level'], string> = {
  novice: 'Mới bắt đầu',
  developing: 'Đang tiến bộ',
  proficient: 'Thành thạo',
  mastered: 'Xuất sắc',
};

function conceptName(concept: Mastery['concept']) {
  return typeof concept === 'string' ? concept : concept.name;
}

// Mastery is derived data: there is no create/edit action here, only the dashboard view.
export default function MasteryItemsPage() {
  const { paging, setPage } = usePagedList({ page: 1, limit: 50 });
  const { data, isLoading, error } = useMasteryList(paging);
  const errorMessage = useQueryErrorMessage(error);

  if (isLoading) return <Loading />;

  const items = data?.data ?? [];
  const chartData = items.map((m) => ({ name: conceptName(m.concept), score: m.score }));

  return (
    <div>
      <PageHeader title="Mức độ thành thạo (Mastery)" />
      {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}
      <div style={{ width: '100%', height: 280, marginBottom: 24 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="score" fill="#1677ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <DataTable<Mastery>
        rowKey="_id"
        dataSource={items}
        meta={data?.meta}
        onPageChange={setPage}
        columns={[
          { title: 'Khái niệm', render: (_, r) => conceptName(r.concept) },
          { title: 'Điểm thành thạo', dataIndex: 'score', render: (s: number) => `${s}%` },
          { title: 'Mức độ', dataIndex: 'level', render: (l: Mastery['level']) => <Tag>{LEVEL_LABEL[l]}</Tag> },
          { title: 'Số lần làm', dataIndex: 'attemptsCount' },
        ]}
      />
    </div>
  );
}
