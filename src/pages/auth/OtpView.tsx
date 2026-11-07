import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, GraduationCap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { requestPasswordReset, verifyOtp } from '@/services/account/account.auth.client';
import { AuthStepper } from './AuthStepper';
import { OtpInput } from './OtpInput';
import { FORGOT_PASSWORD_STEPS } from './steps';
import { SubmitButton, type SubmitStatus } from './SubmitButton';

const RESEND_COOLDOWN_SECONDS = 60;

interface OtpViewProps {
  email: string;
  onBack: () => void;
  onChangeEmail: () => void;
  onVerified: () => void;
}

export function OtpView({ email, onBack, onChangeEmail, onVerified }: OtpViewProps) {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string>();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setInterval(() => setCooldown((s) => Math.max(s - 1, 0)), 1000);
    return () => window.clearInterval(id);
  }, [cooldown]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('Vui lòng nhập đủ 6 số');
      return;
    }
    setStatus('loading');
    try {
      await verifyOtp(otp);
      setStatus('success');
      onVerified();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã OTP không hợp lệ');
      toast.error('Mã OTP không hợp lệ');
      setStatus('idle');
    }
  }

  async function resend() {
    if (cooldown > 0) return;
    try {
      await requestPasswordReset(email);
      toast.success('Đã gửi lại mã OTP');
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không thể gửi lại mã, vui lòng thử lại');
    }
  }

  const minutes = String(Math.floor(cooldown / 60)).padStart(2, '0');
  const seconds = String(cooldown % 60).padStart(2, '0');

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-base font-bold text-foreground">NaviLearn</p>
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Học thông minh · Tiến xa hơn
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Đăng nhập
        </button>
      </div>

      <AuthStepper currentStep={2} labels={FORGOT_PASSWORD_STEPS} />

      <div>
        <h2 className="text-[26px] font-bold leading-tight text-foreground">Xác thực mã OTP</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Nhập mã 6 chữ số vừa được gửi tới hòm thư sinh viên của bạn.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 p-3">
        <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
          <span className="truncate">
            Gửi tới: <span className="font-semibold">{email || '—'}</span>
          </span>
        </span>
        <button
          type="button"
          onClick={onChangeEmail}
          className="shrink-0 text-sm font-medium text-primary hover:underline"
        >
          Đổi email
        </button>
      </div>

      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Mã bảo mật OTP (6 số)</span>
          <OtpInput value={otp} onChange={setOtp} error={error} />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Gửi lại mã sau: {minutes}:{seconds}
          </span>
          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0}
            className="font-medium text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
          >
            Gửi lại mã
          </button>
        </div>

        <SubmitButton label="Xác thực & Tiếp tục" status={status} className="mt-1" />

        <button
          type="button"
          onClick={onChangeEmail}
          className="-mt-2 self-center text-sm text-muted-foreground hover:text-foreground hover:underline"
        >
          Nhập mã sinh viên khác
        </button>
      </form>

      <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Bảo mật chuẩn TLS 1.3 &amp; Mã hoá 256-bit
        </span>
        <span>NaviLearn ID v2.4</span>
      </div>
    </div>
  );
}
