import * as React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  length?: number;
}

/** 6-box OTP input: auto-advance on type, backspace jumps back, paste fills all boxes. */
export function OtpInput({ value, onChange, error, length = 6 }: OtpInputProps) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const chars = value.split('');
    return Array.from({ length }, (_, i) => chars[i] ?? '');
  }, [value, length]);

  function setDigit(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    onChange(next.join(''));
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, '').slice(-1);
    setDigit(index, char);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!text) return;
    e.preventDefault();
    onChange(text);
    const lastIndex = Math.min(text.length, length) - 1;
    refs.current[Math.max(lastIndex, 0)]?.focus();
  }

  return (
    <div>
      <div className="flex gap-2" role="group" aria-label="Mã OTP">
        {digits.map((digit, i) => (
          <motion.input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            animate={digit ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.2 }}
            inputMode="numeric"
            maxLength={1}
            aria-label={`Số thứ ${i + 1}`}
            className={cn(
              'h-14 w-12 rounded-xl border bg-card text-center text-lg font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary',
              error ? 'border-danger' : 'border-input',
            )}
          />
        ))}
      </div>
      {error && (
        <p role="alert" aria-live="polite" className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
