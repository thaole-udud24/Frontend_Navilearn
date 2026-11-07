import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { AtSign, Eye, EyeOff, Lock } from 'lucide-react';
import { toast } from 'sonner';

import { Checkbox } from '@/components/ui/checkbox';
import { fieldSlideUp, formStagger, shakeX } from '@/lib/motion';
import { loginSchema, type LoginFormValues } from '@/schemas/auth';
import { FloatingInput } from './FloatingInput';
import { GoogleButton } from './GoogleButton';
import { SubmitButton, type SubmitStatus } from './SubmitButton';

interface LoginFormProps {
  onSubmit: (values: LoginFormValues) => Promise<void>;
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSubmit, onForgotPassword, onSwitchToRegister }: LoginFormProps) {
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [shake, setShake] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    // Decision: RHF's built-in `onTouched` mode gives us "validate on first blur, then on every
    // change" for free — the exact onBlur-then-onChange behavior the spec asks for — without a
    // hand-rolled mode switch.
    mode: 'onTouched',
    defaultValues: { identifier: '', password: '', remember: false },
  });

  useEffect(() => {
    firstFieldRef.current?.focus();
  }, []);

  async function submit(values: LoginFormValues) {
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

  const identifierField = register('identifier');
  const identifierValue = watch('identifier');

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
      <motion.div variants={formStagger} initial="hidden" animate="visible" className="flex flex-col gap-4">
        <motion.div variants={fieldSlideUp}>
          <FloatingInput
            {...identifierField}
            ref={(el) => {
              identifierField.ref(el);
              firstFieldRef.current = el;
            }}
            id="login-identifier"
            label="Email hoặc Mã sinh viên"
            icon={AtSign}
            autoComplete="username"
            error={touchedFields.identifier ? errors.identifier?.message : undefined}
            valid={Boolean(touchedFields.identifier && !errors.identifier && identifierValue)}
          />
        </motion.div>

        <motion.div variants={fieldSlideUp}>
          <FloatingInput
            {...register('password')}
            id="login-password"
            label="Mật khẩu"
            icon={Lock}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
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
        </motion.div>

        <motion.div variants={fieldSlideUp} className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-muted-foreground" htmlFor="login-remember">
            <Controller
              name="remember"
              control={control}
              render={({ field }) => (
                <Checkbox id="login-remember" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
            Ghi nhớ đăng nhập
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="relative text-primary after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
          >
            Quên mật khẩu?
          </button>
        </motion.div>

        <motion.div variants={fieldSlideUp}>
          <SubmitButton label="Đăng nhập" status={status} />
        </motion.div>

        <motion.div variants={fieldSlideUp} className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          Hoặc
          <span className="h-px flex-1 bg-border" />
        </motion.div>

        <motion.div variants={fieldSlideUp}>
          <GoogleButton />
        </motion.div>
      </motion.div>

      <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
        Chưa có tài khoản?
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="relative font-bold text-primary after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
        >
          Đăng ký ngay
        </button>
      </p>
    </motion.form>
  );
}
