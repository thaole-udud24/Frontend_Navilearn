export const PASSWORD_MIN_LENGTH = 8; // BR-49
export const PASSWORD_MAX_LENGTH = 64;

/** Returns the first problem with the new password, or null when it is acceptable. */
export function validateNewPassword(current: string, next: string, confirm: string): string | null {
  if (next.length < PASSWORD_MIN_LENGTH) return `Mật khẩu mới tối thiểu ${PASSWORD_MIN_LENGTH} ký tự`;
  if (next.length > PASSWORD_MAX_LENGTH) return `Mật khẩu mới tối đa ${PASSWORD_MAX_LENGTH} ký tự`;
  if (next === current) return 'Mật khẩu mới phải khác mật khẩu hiện tại';
  if (next !== confirm) return 'Xác nhận mật khẩu không khớp';
  return null;
}
