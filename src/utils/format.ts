import dayjs from 'dayjs';

export function formatCurrency(amount: number, currency = 'VND'): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount);
}

export function formatDate(value: string | number | Date, pattern = 'DD/MM/YYYY'): string {
  return dayjs(value).format(pattern);
}
