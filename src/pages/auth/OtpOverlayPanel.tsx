import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formStagger, textLineReveal } from '@/lib/motion';
import { AuthIllustration } from './AuthIllustration';

interface OtpOverlayPanelProps {
  title?: string;
  highlight?: string;
  body?: string;
  onBackToLogin?: () => void;
}

/**
 * Right-column overlay for the forgot/OTP/reset sub-views — same shell, gradient, illustration
 * and footer as the login/register `OverlayPanel` (per design consistency request), just with
 * flow-specific copy instead of a mode-swap CTA.
 */
export function OtpOverlayPanel({
  title = 'Khôi phục quyền truy cập',
  highlight = 'truy cập',
  body = 'Chỉ mất vài bước để lấy lại mật khẩu và tiếp tục hành trình học tập của bạn.',
  onBackToLogin,
}: OtpOverlayPanelProps) {
  return (
    <div
      className="relative hidden h-full flex-col items-center justify-center gap-6 overflow-hidden p-10 text-center text-white md:flex"
      style={{ backgroundImage: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
    >
      <motion.div
        variants={formStagger}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex flex-col items-center gap-5"
      >
        <motion.div variants={textLineReveal}>
          <AuthIllustration />
        </motion.div>
        <div className="overflow-hidden">
          <motion.div variants={textLineReveal} className="text-[28px] font-bold leading-tight text-white/85 sm:text-[32px]">
            {title.split(highlight)[0]}
            <span className="text-white">{highlight}</span>
          </motion.div>
        </div>
        <motion.p variants={textLineReveal} className="max-w-xs text-sm text-white/70">
          {body}
        </motion.p>
        {onBackToLogin && (
          <motion.div variants={textLineReveal}>
            <Button
              type="button"
              variant="ghost"
              onClick={onBackToLogin}
              className="gap-2 rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              Đăng nhập
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </motion.div>

      <p className="absolute bottom-6 left-0 right-0 text-xs text-white/60">
        © 2025 NaviLearn. Nền tảng học tập thông minh.
      </p>
    </div>
  );
}
