import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';

import { fadeUp } from '@/lib/motion';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/schemas/auth';
import { requestPasswordReset } from '@/services/account/account.auth.client';
import { AuthStepper } from './AuthStepper';
import { FloatingInput } from './FloatingInput';
import { SubmitButton, type SubmitStatus } from './SubmitButton';
import { FORGOT_PASSWORD_STEPS } from './steps';

interface ForgotPasswordViewProps {
  onBack: () => void;
  onSent: (email: string) => void;
}

export function ForgotPasswordView({ onBack, onSent }: ForgotPasswordViewProps) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), mode: 'onTouched' });

  async function submit(values: ForgotPasswordFormValues) {
    setStatus('loading');
    try {
      await requestPasswordReset(values.email);
      setStatus('success');
      setSent(true);
      setSentEmail(values.email);
    } catch (error) {
      setStatus('error');
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại');
      window.setTimeout(() => setStatus('idle'), 1200);
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <button type="button" onClick={onBack} className="self-start text-sm text-muted-foreground hover:text-foreground">
        ← Quay lại đăng nhập
      </button>

      <AuthStepper currentStep={1} labels={FORGOT_PASSWORD_STEPS} />

      <AnimatePresence mode="wait" initial={false}>
        {!sent ? (
          <motion.div key="form" variants={fadeUp} initial="hidden" animate="visible" exit={{ opacity: 0 }} className="flex flex-col gap-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Quên mật khẩu?</h2>
              <p className="text-sm text-muted-foreground">
                Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu.
              </p>
            </div>
            <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
              <FloatingInput
                {...register('email')}
                id="forgot-email"
                label="Email"
                icon={Mail}
                autoComplete="email"
                error={touchedFields.email ? errors.email?.message : undefined}
              />
              <SubmitButton label="Gửi liên kết" status={status} />
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-3 py-6 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: -4 }}
              transition={{ duration: 0.6 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <Mail className="h-8 w-8" />
            </motion.div>
            <h3 className="font-semibold text-foreground">Đã gửi email</h3>
            <p className="text-sm text-muted-foreground">Vui lòng kiểm tra hộp thư để đặt lại mật khẩu.</p>
            <button
              type="button"
              onClick={() => onSent(sentEmail)}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              Nhập mã OTP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
