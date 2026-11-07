import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { GraduationCap, Moon, Sun } from 'lucide-react';

import { cn } from '@/lib/utils';
import { cardEntrance, popIn, springTransition, textLineReveal } from '@/lib/motion';
import { STORAGE_KEYS } from '@/constants/storageKeys';
import { ROLES } from '@/constants/enums';
import { PATHS } from '@/routes/paths';
import { useAuthStore } from '@/hooks/useAuth';
import { toApiError } from '@/services/apiError';
import { login, register as registerClient } from '@/services/account/account.auth.client';
import type { LoginResponse } from '@/services/account/account.auth.types';
import type { LoginFormValues, RegisterFormValues } from '@/schemas/auth';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { OverlayPanel } from './OverlayPanel';
import { ForgotPasswordView } from './ForgotPasswordView';
import { ResetPasswordView } from './ResetPasswordView';
import { OtpView } from './OtpView';
import { OtpOverlayPanel } from './OtpOverlayPanel';

// AnimatedBackground is particle/canvas-only decoration — lazy-load it and show a plain CSS
// gradient (rendered unconditionally below, in the same spot) while its chunk is loading so
// there is no layout shift (spec step 8).
const AnimatedBackground = lazy(() => import('./AnimatedBackground'));

type Mode = 'login' | 'register';
type View = Mode | 'forgot' | 'otp' | 'reset';

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 1023px)').matches);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

/** Login message is always this generic phrase, regardless of what the backend/mock said,
 * so a wrong email reveals nothing about whether the account exists (spec step 8). */
function toFriendlyMessage(error: unknown, kind: 'login' | 'register'): string {
  if (kind === 'login') return 'Email hoặc mật khẩu không đúng';
  const apiErr = toApiError(error);
  if (apiErr.code === 'EMAIL_EXISTS') return 'Email này đã được sử dụng';
  return apiErr.message || 'Có lỗi xảy ra, vui lòng thử lại';
}

export default function AuthPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const reduced = Boolean(useReducedMotion());
  const isMobile = useIsMobile();

  const [view, setView] = useState<View>('login');
  const [dark, setDark] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springRotateX = useSpring(rotateX, { stiffness: 150, damping: 20 });
  const springRotateY = useSpring(rotateY, { stiffness: 150, damping: 20 });

  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mvY, { stiffness: 50, damping: 20 });
  const parallaxEnabled = !reduced && !isMobile;

  useEffect(() => {
    if (!parallaxEnabled) return;
    function handleMove(e: MouseEvent) {
      mvX.set((e.clientX / window.innerWidth - 0.5) * 24);
      mvY.set((e.clientY / window.innerHeight - 0.5) * 24);
    }
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [parallaxEnabled, mvX, mvY]);

  function handleCardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!parallaxEnabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * 6);
    rotateX.set(-py * 6);
  }
  function resetTilt() {
    rotateX.set(0);
    rotateY.set(0);
  }

  async function completeAuth(result: LoginResponse) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, result.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, result.refreshToken);
    setUser(result.user);
    setRevealing(true);
    window.setTimeout(() => {
      navigate(result.user.role === ROLES.ADMIN ? PATHS.admin.root : PATHS.student.root);
    }, 650);
  }

  async function handleLoginSubmit(values: LoginFormValues) {
    try {
      const result = await login({ email: values.identifier, password: values.password });
      await completeAuth(result);
    } catch (error) {
      throw new Error(toFriendlyMessage(error, 'login'));
    }
  }

  async function handleRegisterSubmit(values: RegisterFormValues) {
    try {
      const result = await registerClient({ email: values.email, password: values.password, fullName: values.fullName });
      await completeAuth(result);
    } catch (error) {
      throw new Error(toFriendlyMessage(error, 'register'));
    }
  }

  const mode: Mode = view === 'register' ? 'register' : 'login';

  return (
    <div className={cn('tw-scope relative min-h-screen w-full overflow-x-hidden overflow-y-auto bg-background', dark && 'dark')}>
      <Background reduced={reduced} springX={springX} springY={springY} />

      <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center gap-6 p-4 py-10">
        <AnimatePresence mode="wait">
          {view === 'login' || view === 'register' ? (
            <motion.div
              key="auth-card"
              ref={cardRef}
              variants={cardEntrance}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, scale: 0.98 }}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={resetTilt}
              style={{ perspective: 1600 }}
              className="relative w-full max-w-[1080px]"
            >
              <motion.div
                style={{ rotateX: springRotateX, rotateY: springRotateY }}
                className="overflow-hidden rounded-[28px] shadow-[0_30px_80px_-20px_rgba(11,58,130,0.35),0_10px_30px_-10px_rgba(11,58,130,0.2)]"
              >
                {/* Desktop: side-by-side, overlay swaps sides via `layout` FLIP animation. */}
                <div className="hidden h-[680px] grid-cols-2 bg-card lg:grid">
                  {mode === 'login' ? (
                    <>
                      <FormHalf key="form" mode={mode} />
                      <OverlayHalf key="overlay" mode={mode} />
                    </>
                  ) : (
                    <>
                      <OverlayHalf key="overlay" mode={mode} />
                      <FormHalf key="form" mode={mode} />
                    </>
                  )}
                </div>

                {/* Mobile/tablet: single column with a Tabs-style mode switch. */}
                <div className="flex flex-col gap-6 bg-card p-6 lg:hidden">
                  <Logo />
                  <MobileModeSwitch mode={mode} onChange={(m) => setView(m)} />
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={mode}
                      initial={{ opacity: 0, x: mode === 'login' ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: mode === 'login' ? 30 : -30 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderForm(mode)}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          ) : view === 'otp' ? (
            <motion.div
              key="otp-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-[28px] bg-card shadow-[0_30px_80px_-20px_rgba(11,58,130,0.35),0_10px_30px_-10px_rgba(11,58,130,0.2)] md:h-[680px] md:grid-cols-2"
            >
              <div className="flex h-full items-center overflow-y-auto p-8 lg:p-10">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                  <OtpView
                    email={resetEmail}
                    onBack={() => setView('login')}
                    onChangeEmail={() => setView('forgot')}
                    onVerified={() => setView('reset')}
                  />
                </div>
              </div>
              <OtpOverlayPanel onBackToLogin={() => setView('login')} />
            </motion.div>
          ) : (
            <motion.div
              key="sub-view"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="grid w-full max-w-[1080px] grid-cols-1 overflow-hidden rounded-[28px] bg-card shadow-[0_30px_80px_-20px_rgba(11,58,130,0.35),0_10px_30px_-10px_rgba(11,58,130,0.2)] md:h-[680px] md:grid-cols-2"
            >
              <div className="flex h-full items-center overflow-y-auto p-8 lg:p-10">
                <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
                  {view === 'forgot' && (
                    <ForgotPasswordView
                      onBack={() => setView('login')}
                      onSent={(email) => {
                        setResetEmail(email);
                        setView('otp');
                      }}
                    />
                  )}
                  {view === 'reset' && <ResetPasswordView onBack={() => setView('otp')} onDone={() => setView('login')} />}
                </div>
              </div>
              <OtpOverlayPanel onBackToLogin={() => setView('login')} />
            </motion.div>
          )}
        </AnimatePresence>

        {(view === 'login' || view === 'register') && (
          <p className="text-center text-xs text-muted-foreground">© 2025 NaviLearn. Nền tảng học tập thông minh.</p>
        )}
      </div>

      <AnimatePresence>
        {revealing && (
          <motion.div
            initial={{ clipPath: 'circle(0% at 50% 100%)' }}
            animate={{ clipPath: 'circle(150% at 50% 100%)' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-primary"
          />
        )}
      </AnimatePresence>
    </div>
  );

  function renderForm(m: Mode) {
    return m === 'login' ? (
      <LoginForm
        onSubmit={handleLoginSubmit}
        onForgotPassword={() => setView('forgot')}
        onSwitchToRegister={() => setView('register')}
      />
    ) : (
      <RegisterForm onSubmit={handleRegisterSubmit} onSwitchToLogin={() => setView('login')} />
    );
  }

  function FormHalf({ mode: m }: { mode: Mode }) {
    return (
      <motion.div layout transition={springTransition} className="relative flex items-center justify-center p-10">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          <Logo />
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={m}
              initial={{ opacity: 0, x: m === 'login' ? -40 : 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: m === 'login' ? 40 : -40 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {renderForm(m)}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  function OverlayHalf({ mode: m }: { mode: Mode }) {
    return (
      <motion.div layout transition={springTransition} className="relative">
        <OverlayPanel mode={m} onSwitch={() => setView(m === 'login' ? 'register' : 'login')} />
      </motion.div>
    );
  }

}

function Logo() {
  return (
    <motion.div variants={popIn} initial="hidden" animate="visible" className="flex flex-col items-center gap-2">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <GraduationCap className="h-8 w-8" />
      </span>
      <div className="overflow-hidden">
        <motion.span variants={textLineReveal} className="block text-[28px] font-extrabold tracking-tight text-foreground">
          NaviLearn
        </motion.span>
      </div>
      <p className="text-xs text-muted-foreground">Học thông minh · Tiến xa hơn</p>
    </motion.div>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-card/80 text-foreground shadow-card backdrop-blur transition-colors hover:bg-card"
    >
      <AnimatePresence mode="wait" initial={false}>
        {dark ? (
          <motion.span key="sun" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
            <Sun className="h-4 w-4" />
          </motion.span>
        ) : (
          <motion.span key="moon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
            <Moon className="h-4 w-4" />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

function MobileModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return (
    <div className="relative flex rounded-control bg-muted p-1">
      {(['login', 'register'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          className={cn(
            'relative z-10 flex-1 rounded-badge px-3 py-2 text-sm font-medium transition-colors',
            mode === m ? 'text-foreground' : 'text-muted-foreground',
          )}
        >
          {m === 'login' ? 'Đăng nhập' : 'Đăng ký'}
        </button>
      ))}
      <motion.div
        layoutId="mobile-tab-indicator"
        transition={springTransition}
        className="absolute inset-y-1 w-[calc(50%-4px)] rounded-badge bg-card shadow-card"
        style={{ left: mode === 'login' ? 4 : '50%' }}
      />
    </div>
  );
}

function Background({
  reduced,
  springX,
  springY,
}: {
  reduced: boolean;
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
}) {
  const x = useTransform(springX, (v) => v);
  const y = useTransform(springY, (v) => v);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#eef1f8,#e6eaf2)]">
      {!reduced && (
        <>
          <motion.div
            className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/30 blur-3xl"
            animate={{ x: [0, 60, -40, 0], y: [0, 40, -30, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute right-[-10%] top-1/3 h-80 w-80 rounded-full bg-[#6D4AFF]/25 blur-3xl"
            animate={{ x: [0, -50, 30, 0], y: [0, -30, 40, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-[-15%] left-1/3 h-72 w-72 rounded-full bg-primary-hover/25 blur-3xl"
            animate={{ x: [0, 40, -30, 0], y: [0, -20, 30, 0] }}
            transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          />

          <Suspense fallback={null}>
            <motion.div style={{ x, y }} className="absolute inset-0">
              <AnimatedBackground />
            </motion.div>
          </Suspense>
        </>
      )}
    </div>
  );
}
