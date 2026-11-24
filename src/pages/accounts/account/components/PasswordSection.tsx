import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { changePassword } from '@/services/account/account.profile.api';
import { toApiError } from '@/services/apiError';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validateNewPassword } from './passwordRules';

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm">
      {label}
      <div className="relative mt-1">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          autoComplete={autoComplete}
          className="pr-10"
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label={visible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </label>
  );
}

/** FE-STU-76 / FE-ADM-86: change the password of the signed-in account. */
export function PasswordSection() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => changePassword({ currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      toast.success('Đã đổi mật khẩu. Các phiên đăng nhập khác đã bị đăng xuất.');
    },
    onError: (error) => setFormError(toApiError(error).message),
  });

  const submit = () => {
    const problem = validateNewPassword(current, next, confirm);
    setFormError(problem);
    if (!problem) mutation.mutate();
  };

  return (
    <form
      className="flex max-w-md flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <PasswordField label="Mật khẩu hiện tại" value={current} onChange={setCurrent} autoComplete="current-password" />
      <PasswordField label="Mật khẩu mới" value={next} onChange={setNext} autoComplete="new-password" />
      <PasswordField label="Nhập lại mật khẩu mới" value={confirm} onChange={setConfirm} autoComplete="new-password" />
      <p className="text-xs text-muted-foreground">
        Từ {PASSWORD_MIN_LENGTH} đến {PASSWORD_MAX_LENGTH} ký tự. Không dùng mật khẩu phổ biến hoặc chứa email, họ tên của bạn.
      </p>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <div>
        <Button type="submit" disabled={!current || !next || !confirm || mutation.isPending}>
          {mutation.isPending && <Loader2 className="animate-spin" />}
          Đổi mật khẩu
        </Button>
      </div>
    </form>
  );
}
