// Hand-written mock generators for the dashboard demo (no @faker-js/faker in
// deps; adding it just for this would be overkill, per spec's own fallback).

export interface MockUser {
  id: string;
  code: string;
  name: string;
  role: string;
  status: 'success' | 'warning' | 'danger';
  statusLabel: string;
  createdAt: string;
}

const FIRST_NAMES = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Vũ', 'Đặng', 'Bùi', 'Đỗ'];
const MID_NAMES = ['Văn', 'Thị', 'Hữu', 'Minh', 'Đức', 'Ngọc', 'Quang', 'Thành', 'Gia', 'Anh'];
const LAST_NAMES = ['An', 'Bình', 'Chi', 'Dung', 'Em', 'Phúc', 'Giang', 'Hà', 'Khôi', 'Linh', 'Mai', 'Nam'];
const ROLES = ['Học sinh', 'Giáo viên', 'Quản trị viên'];
const STATUSES: Array<{ status: MockUser['status']; label: string }> = [
  { status: 'success', label: 'Đang hoạt động' },
  { status: 'warning', label: 'Chờ xác minh' },
  { status: 'danger', label: 'Đã khoá' },
];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export function generateUsers(count = 81): MockUser[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const name = `${pick(FIRST_NAMES, n)} ${pick(MID_NAMES, n + 3)} ${pick(LAST_NAMES, n + 7)}`;
    const { status, label } = pick(STATUSES, n);
    const day = String((n % 28) + 1).padStart(2, '0');
    const month = String(((n * 3) % 12) + 1).padStart(2, '0');
    return {
      id: `u-${n}`,
      code: `NV${String(n).padStart(4, '0')}`,
      name,
      role: pick(ROLES, n + 1),
      status,
      statusLabel: label,
      createdAt: `${day}/${month}/2026`,
    };
  });
}

export interface WeeklyPlanRow {
  id: string;
  subject: string;
  activity: string;
  deadline: string;
  progress: number;
  status: 'success' | 'warning' | 'danger' | 'info';
  statusLabel: string;
}

const SUBJECTS = ['Toán học', 'Vật lý', 'Hoá học', 'Tiếng Anh', 'Ngữ văn', 'Sinh học', 'Lịch sử', 'Địa lý'];
const ACTIVITIES = [
  'Ôn tập chương trọng tâm',
  'Làm bài tập trắc nghiệm',
  'Xem video bài giảng',
  'Luyện đề thi thử',
  'Tổng hợp ghi chú',
  'Thảo luận nhóm học tập',
];
const PLAN_STATUSES: Array<{ status: WeeklyPlanRow['status']; label: string }> = [
  { status: 'success', label: 'Hoàn thành' },
  { status: 'info', label: 'Đang thực hiện' },
  { status: 'warning', label: 'Sắp đến hạn' },
  { status: 'danger', label: 'Quá hạn' },
];

export function generateWeeklyPlan(count = 16): WeeklyPlanRow[] {
  return Array.from({ length: count }, (_, i) => {
    const n = i + 1;
    const { status, label } = pick(PLAN_STATUSES, n);
    return {
      id: `wp-${n}`,
      subject: pick(SUBJECTS, n),
      activity: pick(ACTIVITIES, n + 2),
      deadline: `${String((n % 28) + 1).padStart(2, '0')}/11/2026`,
      progress: (n * 13) % 101,
      status,
      statusLabel: label,
    };
  });
}

export const studentMasteryByTopic = [
  { topic: 'Đại số', value: 82 },
  { topic: 'Hình học', value: 64 },
  { topic: 'Giải tích', value: 71 },
  { topic: 'Ngữ pháp', value: 88 },
  { topic: 'Từ vựng', value: 55 },
];

export const studentOverallProgress = 68;

export const systemActivity30Days = Array.from({ length: 30 }, (_, i) => ({
  day: `${i + 1}`,
  value: 40 + Math.round(30 * Math.sin(i / 3) + i * 1.2),
}));

export const masteryDistribution = [
  { level: 'Yếu', value: 120 },
  { level: 'Trung bình', value: 340 },
  { level: 'Khá', value: 410 },
  { level: 'Giỏi', value: 260 },
  { level: 'Xuất sắc', value: 90 },
];

export interface ActivityLogEntry {
  id: string;
  text: string;
  time: string;
}

export const recentActivityLog: ActivityLogEntry[] = [
  { id: 'a1', text: 'Quản trị viên cập nhật ngưỡng cảnh báo rủi ro', time: '5 phút trước' },
  { id: 'a2', text: 'Hệ thống tạo 12 tài khoản học sinh mới', time: '32 phút trước' },
  { id: 'a3', text: 'Giáo viên Nguyễn Văn An xuất bản bài kiểm tra mới', time: '1 giờ trước' },
  { id: 'a4', text: 'Hệ thống phát hiện 3 cảnh báo rủi ro học tập', time: '2 giờ trước' },
  { id: 'a5', text: 'Sao lưu dữ liệu định kỳ hoàn tất', time: 'Hôm qua' },
];
