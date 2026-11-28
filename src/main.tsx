import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/styles/global.less';
import '@fontsource/montserrat/400.css';
import '@fontsource/montserrat/500.css';
import '@fontsource/montserrat/600.css';
import '@fontsource/montserrat/700.css';
import '@/styles/tailwind.css';
import { App } from '@/app';
import { applyTheme, getStoredTheme } from '@/utils/theme';

// Applied before first render so there's no light->dark flash for a student who chose dark mode.
applyTheme(getStoredTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
