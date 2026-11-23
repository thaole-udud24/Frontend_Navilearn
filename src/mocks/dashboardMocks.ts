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

/** 3-way breakdown behind the goal donut (hoàn thành / đang học / chưa bắt đầu), sums to 100. */
export const studentGoalBreakdown = [
  { label: 'Hoàn thành', value: 68, color: 'var(--mint)' },
  { label: 'Đang học', value: 17, color: 'var(--warning)' },
  { label: 'Chưa bắt đầu', value: 15, color: 'var(--primary-hover)' },
];

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

// ---- Student dashboard (bento) mocks ----

export interface ActivityPoint {
  day: string;
  studied: number;
  practiced: number;
}

/** Two-series weekly activity: minutes studied vs. questions practiced. */
export const weeklyActivitySeries: ActivityPoint[] = [
  { day: 'T2', studied: 34, practiced: 18 },
  { day: 'T3', studied: 48, practiced: 22 },
  { day: 'T4', studied: 62, practiced: 30 },
  { day: 'T5', studied: 82, practiced: 26 },
  { day: 'T6', studied: 58, practiced: 34 },
  { day: 'T7', studied: 65, practiced: 28 },
  { day: 'CN', studied: 45, practiced: 20 },
];

export type CourseStatus = 'learning' | 'started' | 'review';

export interface StudentCourse {
  id: string;
  name: string;
  code: string;
  chapters: number;
  progress: number;
  status: CourseStatus;
  tone: 'blue' | 'peach' | 'mint';
}

export const studentCourses: StudentCourse[] = [
  {
    id: 'c1',
    name: 'Giải tích 1',
    code: 'MAT101',
    chapters: 12,
    progress: 68,
    status: 'learning',
    tone: 'blue',
  },
  {
    id: 'c2',
    name: 'Cấu trúc dữ liệu & GT',
    code: 'CS202',
    chapters: 10,
    progress: 40,
    status: 'review',
    tone: 'peach',
  },
  {
    id: 'c3',
    name: 'Xác suất thống kê',
    code: 'MAT205',
    chapters: 8,
    progress: 15,
    status: 'started',
    tone: 'mint',
  },
];

export interface ClassWeekStat {
  week: string;
  value: number;
}

export const classWeeklyStats: ClassWeekStat[] = [
  { week: 'T6', value: 55 },
  { week: 'T7', value: 70 },
  { week: 'T8', value: 40 },
  { week: 'T9', value: 100 },
  { week: 'T10', value: 65 },
];

export interface StudentActivityEntry {
  id: string;
  text: string;
  time: string;
  status: 'success' | 'info' | 'ai';
  statusLabel: string;
}

export type ScheduleType = 'class' | 'deadline' | 'exam';

export interface CalendarEventDay {
  day: number;
  type: ScheduleType;
}

/** Event dots plotted on the mini calendar — mock only, no backend calendar module yet. */
export const novemberEventDays: CalendarEventDay[] = [
  { day: 2, type: 'class' },
  { day: 3, type: 'deadline' },
  { day: 9, type: 'class' },
  { day: 11, type: 'deadline' },
  { day: 11, type: 'exam' },
  { day: 17, type: 'class' },
  { day: 19, type: 'exam' },
  { day: 24, type: 'class' },
];

export interface ScheduleItem {
  id: string;
  type: ScheduleType;
  title: string;
  subtitle: string;
  time: string;
  meta: string;
}

export const upcomingSchedule: ScheduleItem[] = [
  {
    id: 'sch1',
    type: 'class',
    title: 'Lớp học trực tuyến',
    subtitle: 'Giải tích 1: Bài tập Đạo hàm',
    time: 'H.NAY 08:30',
    meta: 'Giảng viên: TS. Nguyễn Văn Nam · Phòng A201',
  },
  {
    id: 'sch2',
    type: 'deadline',
    title: 'Deadline nộp bài',
    subtitle: 'Bài tập Cấu trúc dữ liệu & GT #4',
    time: 'HẠN 23:59',
    meta: 'Còn 6 giờ · Đã nộp 0/1 file đính kèm (.cpp)',
  },
  {
    id: 'sch3',
    type: 'exam',
    title: 'Kiểm tra giữa kỳ',
    subtitle: 'Thử Xác suất thống kê (NaviTest)',
    time: '17/11 09:00',
    meta: '60 phút · Biến ngẫu nhiên & Phân phối',
  },
];

export const studentRecentActivity: StudentActivityEntry[] = [
  {
    id: 'sa1',
    text: 'Hoàn thành bài luyện tập Đạo hàm',
    time: '10 phút trước',
    status: 'success',
    statusLabel: 'Hoàn thành',
  },
  {
    id: 'sa2',
    text: 'Mastery Giới hạn tăng lên mức Đã vững',
    time: '1 giờ trước',
    status: 'info',
    statusLabel: 'Cập nhật',
  },
  { id: 'sa3', text: 'Navi giải thích 1 câu bạn làm sai', time: 'Hôm qua', status: 'ai', statusLabel: 'AI' },
];
