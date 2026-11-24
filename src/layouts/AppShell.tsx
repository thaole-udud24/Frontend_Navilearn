import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wrench, HelpCircle, Bug, BookOpen } from 'lucide-react';

import { cn } from '@/lib/utils';
import { APP_FOOTER_TEXT } from '@/constants/app';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MascotWidget } from './MascotWidget';
import type { MenuGroup } from './types';

interface AppShellProps {
  menu: MenuGroup[];
  title: string;
  breadcrumb?: string[];
  userName: string;
  roleLabel: string;
  notificationCount?: number;
  /** Shown under the NaviLearn wordmark in the expanded sidebar — defaults per `area` so every
   * page's sidebar looks identical without each one having to pass it. Pass an explicit string to
   * override, or `''` to force none. */
  tagline?: string;
  /** Use the compact single-row topbar instead of the colored heading banner — for pages whose
   * own content (e.g. a hero section) already carries the greeting/title. */
  compactHeader?: boolean;
  onLogout?: () => void;
  /** 'admin' gives the sidebar the dark-navy palette so the Admin area reads as visually distinct
   * from the Student area at a glance. */
  area?: 'student' | 'admin';
  children: ReactNode;
}

export function AppShell({
  menu,
  title,
  breadcrumb,
  userName,
  roleLabel,
  notificationCount,
  tagline,
  compactHeader,
  onLogout,
  area = 'student',
  children,
}: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Same sidebar, every student page — previously only Dashboard passed `tagline`, so its sidebar
  // looked taller/different from every other menu. Defaulting it here means no page can forget it.
  const resolvedTagline = tagline ?? (area === 'student' ? 'Explore. Learn. Master.' : undefined);

  return (
    <div className="tw-scope flex min-h-screen bg-background">
      <Sidebar
        groups={menu}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        tagline={resolvedTagline}
        userName={userName}
        roleLabel={roleLabel}
        onLogout={onLogout}
        variant={area === 'admin' ? 'dark' : 'light'}
      />

      {/* min-w-0: a flex item's default min-width is "auto" (its content's intrinsic width), so a
          wide table inside would otherwise stretch this column — and the whole page — instead of
          staying put and letting the table's own overflow-auto wrapper scroll horizontally. */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          title={title}
          breadcrumb={breadcrumb}
          userName={userName}
          roleLabel={roleLabel}
          notificationCount={notificationCount}
          onMobileMenuClick={() => setMobileOpen(true)}
          compact={compactHeader}
          onToggleSidebar={() => setCollapsed((c) => !c)}
          onLogout={onLogout}
        />

        <main
          className={cn(
            'min-w-0 flex-1 p-4 sm:p-6',
            !compactHeader && '-mt-10 rounded-card bg-card shadow-card',
          )}
        >
          {children}
        </main>

        <footer className="px-4 pb-24 pt-6 text-center text-xs text-muted-foreground sm:px-6">
          {APP_FOOTER_TEXT}
        </footer>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.button
            type="button"
            aria-label="Hỗ trợ"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Wrench className="h-6 w-6" />
          </motion.button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="tw-scope" align="end">
          <DropdownMenuItem>
            <HelpCircle className="h-4 w-4" /> Hỗ trợ
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bug className="h-4 w-4" /> Báo lỗi
          </DropdownMenuItem>
          <DropdownMenuItem>
            <BookOpen className="h-4 w-4" /> Hướng dẫn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {area === 'student' && <MascotWidget />}
    </div>
  );
}
