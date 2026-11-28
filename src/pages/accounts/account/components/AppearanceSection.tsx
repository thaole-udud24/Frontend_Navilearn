import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { applyTheme, getStoredTheme, type ThemeMode } from '@/utils/theme';

/** N14 "Giao diện": a real light/dark toggle — the CSS already ships a full `.dark` variable set
 * (src/styles/tailwind.css), it just had no toggle wired to it. No i18n/language switcher here: this
 * codebase has no real i18n infrastructure (no react-i18next, every string is hardcoded Vietnamese),
 * so a "ngôn ngữ" tab would be a fake switcher with nothing behind it — omitted on purpose rather
 * than half-built. (The `locale` field on the profile — see ProfileSection's "Ngôn ngữ" select —
 * is a stored preference only; it is not read anywhere to translate the UI.) */
export function AppearanceSection() {
  const [mode, setMode] = useState<ThemeMode>(getStoredTheme());

  const choose = (next: ThemeMode) => {
    setMode(next);
    applyTheme(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Giao diện</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn giao diện sáng hoặc tối cho trình duyệt này. Lưu ý: hệ thống chưa có đổi ngôn ngữ thật (toàn bộ
          giao diện hiện chỉ có tiếng Việt), nên mục này không hiển thị lựa chọn ngôn ngữ để tránh gây hiểu
          nhầm.
        </p>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant={mode === 'light' ? 'default' : 'outline'} onClick={() => choose('light')}>
          <Sun className="h-4 w-4" /> Sáng
        </Button>
        <Button type="button" variant={mode === 'dark' ? 'default' : 'outline'} onClick={() => choose('dark')}>
          <Moon className="h-4 w-4" /> Tối
        </Button>
      </div>
    </div>
  );
}
