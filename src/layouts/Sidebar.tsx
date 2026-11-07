import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { MenuGroup, MenuItem } from './types';

interface SidebarProps {
  groups: MenuGroup[];
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
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
        'relative flex h-11 items-center gap-3 rounded-control px-3 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        collapsed && 'justify-center px-0',
        active ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground hover:bg-muted',
      )}
    >
      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary" />}
      {Icon && <Icon className="h-5 w-5 shrink-0" />}
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
              active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted',
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
    <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-border">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && !collapsed && (
            <div className="px-3 pb-1 text-xs font-bold uppercase text-muted-foreground">{group.label}</div>
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

export function Sidebar({ groups, collapsed, onToggleCollapsed, mobileOpen, onMobileClose }: SidebarProps) {
  const { pathname } = useLocation();

  const header = (collapsedMode: boolean) => (
    <div className="flex h-[72px] shrink-0 items-center gap-2 border-b border-border px-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-primary text-primary-foreground">
        <GraduationCap className="h-5 w-5" />
      </div>
      {!collapsedMode && <span className="truncate text-[20px] font-bold text-foreground">NAVILEARN</span>}
    </div>
  );

  return (
    <TooltipProvider>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'relative hidden shrink-0 flex-col border-r border-border bg-card transition-[width] duration-[250ms] ease-in-out lg:sticky lg:top-0 lg:flex lg:h-screen',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {header(collapsed)}
        <SidebarBody groups={groups} collapsed={collapsed} pathname={pathname} />
        <button
          type="button"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          onClick={onToggleCollapsed}
          className="absolute -right-3.5 bottom-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-card hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
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
              className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-border bg-card lg:hidden"
            >
              {header(false)}
              <SidebarBody groups={groups} collapsed={false} pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
