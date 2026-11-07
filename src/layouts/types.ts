import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  label: string;
  icon?: LucideIcon;
  path?: string;
  roles: Array<'student' | 'admin'>;
  children?: MenuItem[];
}

export interface MenuGroup {
  label?: string;
  items: MenuItem[];
}
