import type { ReactNode } from 'react';
import type { Tournament } from '@/types';

type OverlayThemeId = NonNullable<Tournament['overlayTheme']>;

/** Route overlay output to the correct theme component tree. */
export function resolveOverlayThemeContent(
  theme: OverlayThemeId | undefined,
  theme1: ReactNode,
  theme2: ReactNode,
  theme3: ReactNode,
): ReactNode {
  switch (theme) {
    case 'theme2':
      return theme2;
    case 'theme3':
      return theme3;
    default:
      return theme1;
  }
}
