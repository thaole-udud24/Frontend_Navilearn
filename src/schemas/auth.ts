import { z } from 'zod';

// Shared by register/reset forms: PasswordStrength.tsx scores against the same 4 criteria.
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .regex(/[A-Z]/, 'Mật khẩu cần có ít nhất 1 chữ hoa')
  .regex(/[0-9]/, 'Mật khẩu cần có ít nhất 1 số');

export const loginSchema = z.object({
  // shortcut: backend auth only looks accounts up by email (see account.auth.service.js), so a
  // "Mã sinh viên" value typed here is simply forwarded as the email field — there is no
  // separate student-code lookup on the real API. Upgrade: add a code->email lookup endpoint.
  identifier: z.string().min(1, 'Vui lòng nhập email hoặc mã sinh viên'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
  remember: z.boolean().optional(),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Vui lòng nhập họ và tên'),
    email: z.email('Email không hợp lệ'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    agreeTerms: z.boolean().refine((v) => v === true, { message: 'Bạn cần đồng ý điều khoản sử dụng' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.email('Email không hợp lệ'),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  });
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export const otpSchema = z.object({
  otp: z.string().length(6, 'Vui lòng nhập đủ 6 số'),
});
export type OtpFormValues = z.infer<typeof otpSchema>;
