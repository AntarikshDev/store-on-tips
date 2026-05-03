import { lazy, Suspense, ComponentType } from 'react';

/**
 * Theme registry. Each theme is a self-contained folder under src/themes/{id}/
 * exporting a default component that accepts { bundle } from get-storefront-bundle.
 *
 * Theme Master Projects copy this whole src/themes/ tree.
 */
export const THEMES = {
  bazaar: lazy(() => import('./bazaar')),
  // future: atelier, pulse, bloom, forge, garden
} as const;

export type ThemeId = keyof typeof THEMES;

interface ThemeRendererProps {
  themeId: string;
  bundle: unknown;
  fallback?: React.ReactNode;
}

export const ThemeRenderer = ({ themeId, bundle, fallback }: ThemeRendererProps) => {
  const Theme =
    (THEMES as Record<string, ComponentType<{ bundle: unknown }>>)[themeId] ??
    (THEMES.bazaar as unknown as ComponentType<{ bundle: unknown }>);
  return (
    <Suspense fallback={fallback ?? <div className="p-10 text-center text-sm">Loading theme…</div>}>
      <Theme bundle={bundle} />
    </Suspense>
  );
};
