import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { resetPasswordSchema, type ResetPasswordFormValues } from '@/schemas/auth';
import { resetPassword } from '@/services/account/account.auth.client';
import { AuthStepper } from './AuthStepper';
import { FloatingInput } from './FloatingInput';
import { FORGOT_PASSWORD_STEPS } from './steps';
import { PasswordStrength } from './PasswordStrength';
import { SubmitButton, type SubmitStatus } from './SubmitButton';

interface ResetPasswordViewProps {
  onBack: () => void;
  onDone: () => void;
}

export function ResetPasswordView({ onBack, onDone }: ResetPasswordViewProps) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, touchedFields },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), mode: 'onTouched' });
  const password = watch('password');

  async function submit(values: ResetPasswordFormValues) {
    setStatus('loading');
    try {
      await resetPassword(values.password);
      setStatus('success');
      window.setTimeout(onDone, 600);
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại');
      window.setTimeout(() => setStatus('idle'), 1200);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm text-muted-foreground hover:text-foreground">
        ← Quay lại
      </button>
      <AuthStepper currentStep={3} labels={FORGOT_PASSWORD_STEPS} />
      <div>
        <h2 className="text-lg font-bold text-foreground">Đặt lại mật khẩu</h2>
        <p className="text-sm text-muted-foreground">Tạo một mật khẩu mới cho tài khoản của bạn.</p>
      </div>
      <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <FloatingInput
            {...register('password')}
            id="reset-password"
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            error={touchedFields.password ? errors.password?.message : undefined}
          />
          <PasswordStrength password={password ?? ''} />
        </div>
        <FloatingInput
          {...register('confirmPassword')}
          id="reset-confirm"
          label="Nhập lại mật khẩu"
          type="password"
          autoComplete="new-password"
          error={touchedFields.confirmPassword ? errors.confirmPassword?.message : undefined}
        />
        <SubmitButton label="Đặt lại mật khẩu" status={status} />
      </form>
    </div>
  );
}
