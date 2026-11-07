import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formStagger, textLineReveal } from '@/lib/motion';
import { AuthIllustration } from './AuthIllustration';

interface OverlayPanelProps {
  mode: 'login' | 'register';
  onSwitch: () => void;
}

const CONTENT = {
  login: {
    title: 'Đăng ký ngay để bắt đầu',
    highlight: 'bắt đầu',
    body: 'Khám phá hành trình học tập cá nhân hoá cùng NaviLearn.',
    cta: 'Đăng ký',
  },
  register: {
    title: 'Đăng nhập để tiếp tục',
    highlight: 'tiếp tục',
    body: 'Quay lại với kế hoạch học tập của bạn.',
    cta: 'Đăng nhập',
  },
} as const;

/** Gradient overlay half of the desktop auth card — slides across via its parent's `layout` animation. */
export function OverlayPanel({ mode, onSwitch }: OverlayPanelProps) {
  const content = CONTENT[mode];

  return (
    <div
      className="relative flex h-full flex-col items-center justify-center gap-6 overflow-hidden p-10 text-center text-white"
      style={{ backgroundImage: 'linear-gradient(135deg, var(--primary), var(--primary-hover))' }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          variants={formStagger}
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <motion.div variants={textLineReveal}>
            <AuthIllustration />
          </motion.div>
          <div className="overflow-hidden">
            <motion.div variants={textLineReveal} className="text-[28px] font-bold leading-tight text-white/85 sm:text-[32px]">
              {content.title.split(content.highlight)[0]}
              <span className="text-white">{content.highlight}</span>
            </motion.div>
          </div>
          <motion.p variants={textLineReveal} className="max-w-xs text-sm text-white/70">
            {content.body}
          </motion.p>
          <motion.div variants={textLineReveal}>
            <Button
              type="button"
              variant="ghost"
              onClick={onSwitch}
              className="gap-2 rounded-full bg-white/15 text-white hover:bg-white/25"
            >
              {content.cta}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <p className="absolute bottom-6 left-0 right-0 text-xs text-white/60">
        © 2025 NaviLearn. Nền tảng học tập thông minh.
      </p>
    </div>
  );
}
