'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </MotionConfig>
  );
}
