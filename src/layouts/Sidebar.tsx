import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, GraduationCap, LogOut } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MenuGroup, MenuItem } from './types';

interface SidebarProps {
  groups: MenuGroup[];
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
  tagline?: string;
  userName?: string;
  roleLabel?: string;
  onLogout?: () => void;
  /** 'dark' reuses the app's existing `.dark` (navy) palette, scoped to just the sidebar — used
   * to tell the Admin area apart from the Student area at a glance. */
  variant?: 'light' | 'dark';
}

function isActive(pathname: string, item: MenuItem): boolean {
  if (item.path && pathname.startsWith(item.path)) return true;
  return item.children?.some((c) => isActive(pathname, c)) ?? false;
}

function MenuLeaf({ item, collapsed, active }: { item: MenuItem; collapsed: boolean; active: boolean }) {
  const Icon = item.icon;
  const content = (
    <Link
      to={item.path ?? '#'}
      className={cn(
        'flex h-11 items-center gap-3 rounded-control px-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        collapsed && 'justify-center px-0',
        active ? 'bg-primary font-semibold text-primary-foreground shadow-card' : 'text-foreground hover:bg-muted',
      )}
    >
      {Icon &&
        (active ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control bg-white/20">
            <Icon className="h-4 w-4" />
          </span>
        ) : (
          <Icon className="h-5 w-5 shrink-0" />
        ))}
      {!collapsed && <span className="truncate">{item.label}</span>}
    </Link>
  );

  if (!collapsed) return content;
  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="tw-scope">{item.label}</TooltipContent>
    </Tooltip>
  );
}

function MenuParent({ item, collapsed, pathname }: { item: MenuItem; collapsed: boolean; pathname: string }) {
  const [open, setOpen] = useState(() => isActive(pathname, item));
  const Icon = item.icon;
  const active = isActive(pathname, item);
  const reduced = useReducedMotion();

  if (collapsed) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={item.label}
            className={cn(
              'flex h-11 w-full items-center justify-center rounded-control',
              active ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-muted',
            )}
          >
            {Icon && <Icon className="h-5 w-5" />}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="start" className="tw-scope w-56 p-2">
          <div className="mb-1 px-2 text-sm font-semibold text-foreground">{item.label}</div>
          {item.children?.map((child) => (
            <Link
              key={child.label}
              to={child.path ?? '#'}
              className={cn(
                'block rounded-control px-3 py-2 text-sm hover:bg-muted',
                isActive(pathname, child) && 'font-semibold text-primary',
              )}
            >
              {child.label}
            </Link>
          ))}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          'flex h-11 w-full items-center gap-3 rounded-control px-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          active ? 'font-semibold text-primary' : 'text-foreground hover:bg-muted',
        )}
      >
        {Icon && <Icon className="h-5 w-5 shrink-0" />}
        <span className="flex-1 truncate text-left">{item.label}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: reduced ? 0 : 0.2 }}>
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1 pl-4 pt-1">
              {item.children?.map((child) => (
                <Link
                  key={child.label}
                  to={child.path ?? '#'}
                  className={cn(
                    'rounded-control py-2 pl-4 text-sm text-foreground hover:bg-muted',
                    isActive(pathname, child) && 'font-semibold text-primary',
                  )}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarBody({ groups, collapsed, pathname }: { groups: MenuGroup[]; collapsed: boolean; pathname: string }) {
  return (
    <nav className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && !collapsed && (
            <div className="px-3 pb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.label}</div>
          )}
          <div className="space-y-1">
            {group.items.map((item) =>
              item.children?.length ? (
                <MenuParent key={item.label} item={item} collapsed={collapsed} pathname={pathname} />
              ) : (
                <MenuLeaf key={item.label} item={item} collapsed={collapsed} active={isActive(pathname, item)} />
              ),
            )}
          </div>
        </div>
      ))}
    </nav>
  );
}

function ProfileFooter({
  collapsed,
  userName,
  roleLabel,
  onLogout,
}: {
  collapsed: boolean;
  userName: string;
  roleLabel: string;
  onLogout?: () => void;
}) {
  const initial = userName.trim().charAt(0).toUpperCase();

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 px-2 pb-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-sm font-bold text-primary-foreground">
          {initial}
        </span>
        <button
          type="button"
          aria-label="Đăng xuất"
          onClick={onLogout}
          className="flex h-8 w-8 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="mx-1 mb-3 flex items-center gap-3 rounded-card border border-border bg-card p-3 shadow-card">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-hover text-sm font-bold text-primary-foreground">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold text-foreground">{userName}</div>
        <div className="truncate text-xs text-muted-foreground">{roleLabel}</div>
      </div>
      <button
        type="button"
        aria-label="Đăng xuất"
        onClick={onLogout}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-muted-foreground hover:bg-muted hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Sidebar({
  groups,
  collapsed,
  mobileOpen,
  onMobileClose,
  tagline,
  userName = 'Người dùng',
  roleLabel = '',
  onLogout,
  variant = 'light',
}: SidebarProps) {
  const { pathname } = useLocation();
  const dark = variant === 'dark';

  const header = (collapsedMode: boolean) => (
    <div className={cn('flex h-[72px] shrink-0 flex-col justify-center gap-1.5 border-b border-border px-4', collapsedMode && 'items-center')}>
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
          <GraduationCap className="h-5 w-5" />
        </span>
        {!collapsedMode && <span className="truncate text-lg font-extrabold text-foreground">NaviLearn</span>}
      </div>
      {!collapsedMode && tagline && <span className="pl-11 text-[11px] text-muted-foreground">{tagline}</span>}
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-[250ms] ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen',
          collapsed ? 'w-[76px]' : 'w-[264px]',
          dark && 'dark',
        )}
      >
        {header(collapsed)}
        <SidebarBody groups={groups} collapsed={collapsed} pathname={pathname} />
        <ProfileFooter collapsed={collapsed} userName={userName} roleLabel={roleLabel} onLogout={onLogout} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              aria-hidden
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn('fixed left-0 top-0 z-50 flex h-screen w-[264px] flex-col border-r border-border bg-card lg:hidden', dark && 'dark')}
            >
              {header(false)}
              <SidebarBody groups={groups} collapsed={false} pathname={pathname} />
              <ProfileFooter collapsed={false} userName={userName} roleLabel={roleLabel} onLogout={onLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
