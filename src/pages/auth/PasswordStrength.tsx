import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

const LEVELS = [
  { label: 'Yếu', color: 'bg-danger' },
  { label: 'Trung bình', color: 'bg-warning' },
  { label: 'Khá', color: 'bg-yellow-400' },
  { label: 'Mạnh', color: 'bg-success' },
];

/** Simple 4-point score: length, uppercase, digit, special char — matches passwordSchema's checks. */
function scorePassword(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const score = scorePassword(password);
  const level = LEVELS[Math.max(score - 1, 0)];
  const widthPct = Math.max(score, 1) * 25;

  return (
    <div className="flex flex-col gap-1">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${widthPct}%` }}
          transition={{ duration: 0.3 }}
          className={cn('h-full rounded-full', level.color)}
        />
      </div>
      <span className="text-xs text-muted-foreground">Độ mạnh mật khẩu: {level.label}</span>
    </div>
  );
}
