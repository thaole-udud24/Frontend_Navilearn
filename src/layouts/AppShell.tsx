import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Wrench, HelpCircle, Bug, BookOpen } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { MenuGroup } from './types';

interface AppShellProps {
  menu: MenuGroup[];
  title: string;
  breadcrumb?: string[];
  userName: string;
  roleLabel: string;
  notificationCount?: number;
  children: ReactNode;
}

export function AppShell({ menu, title, breadcrumb, userName, roleLabel, notificationCount, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="tw-scope flex min-h-screen bg-background">
      <Sidebar
        groups={menu}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Header
          title={title}
          breadcrumb={breadcrumb}
          userName={userName}
          roleLabel={roleLabel}
          notificationCount={notificationCount}
          onMobileMenuClick={() => setMobileOpen(true)}
        />

        <main className="-mt-10 flex-1 rounded-card bg-card p-4 shadow-card sm:p-6">
          {children}
        </main>
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
    </div>
  );
}
