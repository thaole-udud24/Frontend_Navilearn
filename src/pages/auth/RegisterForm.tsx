import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { fieldSlideUp, formStagger, shakeX } from '@/lib/motion';
import { registerSchema, type RegisterFormValues } from '@/schemas/auth';
import { FloatingInput } from './FloatingInput';
import { PasswordStrength } from './PasswordStrength';
import { SubmitButton, type SubmitStatus } from './SubmitButton';

interface RegisterFormProps {
  onSubmit: (values: RegisterFormValues) => Promise<void>;
  /** 2-step wizard (name/email/code -> password/confirm/terms). Default: off (single step). */
  twoStep?: boolean;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSubmit, twoStep = false, onSwitchToLogin }: RegisterFormProps) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    formState: { errors, touchedFields },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    // shortcut: 'onTouched' flagged every field as touched+invalid the instant the
    // autofocus effect below ran (before the user typed anything). Validate only after
    // a submit attempt, then live per keystroke — avoids showing errors on a pristine form.
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', agreeTerms: false },
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, [step]);

  const password = watch('password');

  async function submit(values: RegisterFormValues) {
    setStatus('loading');
    try {
      await onSubmit(values);
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setShake(true);
      toast.error(error instanceof Error ? error.message : 'Có lỗi xảy ra, vui lòng thử lại');
      window.setTimeout(() => setStatus('idle'), 1200);
    }
  }

  async function goToStep2() {
    const valid = await trigger(['fullName', 'email']);
    if (valid) setStep(2);
  }

  const fullNameField = register('fullName');
  const emailValue = watch('email');

  const step1Fields = (
    <motion.div variants={formStagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
      <motion.div variants={fieldSlideUp}>
        <FloatingInput
          {...fullNameField}
          ref={(el) => {
            fullNameField.ref(el);
            firstFieldRef.current = el;
          }}
          id="register-fullname"
          label="Họ và tên"
          icon={User}
          autoComplete="name"
          error={touchedFields.fullName ? errors.fullName?.message : undefined}
        />
      </motion.div>
      <motion.div variants={fieldSlideUp}>
        <FloatingInput
          {...register('email')}
          id="register-email"
          label="Email"
          icon={Mail}
          autoComplete="email"
          error={touchedFields.email ? errors.email?.message : undefined}
          valid={Boolean(touchedFields.email && !errors.email && emailValue)}
        />
      </motion.div>
      {twoStep && (
        <motion.div variants={fieldSlideUp}>
          <button
            type="button"
            onClick={goToStep2}
            className="w-full rounded-control bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            Tiếp tục
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  const step2Fields = (
    <motion.div variants={formStagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
      <motion.div variants={fieldSlideUp} className="flex flex-col gap-2">
        <FloatingInput
          {...register('password')}
          id="register-password"
          label="Mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={touchedFields.password ? errors.password?.message : undefined}
          rightElement={
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
        />
        <PasswordStrength password={password ?? ''} />
      </motion.div>

      <motion.div variants={fieldSlideUp}>
        <FloatingInput
          {...register('confirmPassword')}
          id="register-confirm"
          label="Nhập lại mật khẩu"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          error={touchedFields.confirmPassword ? errors.confirmPassword?.message : undefined}
        />
      </motion.div>

      <motion.div variants={fieldSlideUp}>
        <Controller
          name="agreeTerms"
          control={control}
          render={({ field }) => (
            <label className="flex items-start gap-2 text-sm text-muted-foreground" htmlFor="register-agree">
              <Checkbox id="register-agree" checked={field.value} onCheckedChange={field.onChange} className="mt-0.5" />
              Tôi đồng ý với điều khoản sử dụng
            </label>
          )}
        />
        {errors.agreeTerms && (
          <p role="alert" aria-live="polite" className="mt-1 text-xs text-danger">
            {errors.agreeTerms.message}
          </p>
        )}
      </motion.div>

      <motion.div variants={fieldSlideUp} className="flex gap-2">
        {twoStep && (
          <button
            type="button"
            onClick={() => setStep(1)}
            className="rounded-control border border-border px-4 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Quay lại
          </button>
        )}
        <div className="flex-1">
          <SubmitButton label="Tạo tài khoản" status={status} />
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <motion.form
      noValidate
      onSubmit={handleSubmit(submit)}
      variants={shakeX}
      initial="initial"
      animate={shake ? 'shake' : 'initial'}
      onAnimationComplete={() => setShake(false)}
      className="flex w-full flex-col gap-4"
    >
      {twoStep && (
        <div className="flex gap-1.5" aria-hidden>
          <span className={`h-1 flex-1 rounded-full transition-colors ${step >= 1 ? 'bg-primary' : 'bg-muted'}`} />
          <span className={`h-1 flex-1 rounded-full transition-colors ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
        </div>
      )}

      {twoStep ? (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 ? step1Fields : step2Fields}
          </motion.div>
        </AnimatePresence>
      ) : (
        <>
          {step1Fields}
          {step2Fields}
        </>
      )}

      <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        Đã có tài khoản?
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onSwitchToLogin}
          className="rounded-full border-primary/40 bg-transparent text-primary hover:bg-primary/5"
        >
          Đăng nhập
        </Button>
      </p>
    </motion.form>
  );
}
