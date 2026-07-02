import { useLayoutEffect } from 'react';
import type { ClientTheme } from 'types/client.types';

/**
 * Injects a tenant's theme as CSS custom properties on `<html>`, derived
 * from `config.theme` (see ADR-002 in docs/architecture/ARCHITECTURE.md).
 * `ClientTheme` only carries a handful of brand colors + two fonts; the
 * remaining semantic vars (hover/active/glass/glow/disabled) are derived
 * from that base palette below.
 */

// ─── Color helpers ──────────────────────────────────────────────────────────

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): Rgb | null {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return null;
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16),
  };
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0');
}

/** Mixes `hex` toward white by `amount` (0–1). Falls back to the input when it isn't a hex color. */
function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  return `#${toHex(r + (255 - r) * amount)}${toHex(g + (255 - g) * amount)}${toHex(b + (255 - b) * amount)}`;
}

/** Mixes `hex` toward black by `amount` (0–1). Falls back to the input when it isn't a hex color. */
function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  return `#${toHex(r * (1 - amount))}${toHex(g * (1 - amount))}${toHex(b * (1 - amount))}`;
}

/** Returns `rgba(r, g, b, alpha)` for a hex color. Falls back to the input when it isn't a hex color. */
function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

// ─── Variable mapping ───────────────────────────────────────────────────────

function buildThemeVars(theme: ClientTheme): Record<string, string> {
  const {
    colorPrimary,
    colorBg,
    colorSecondary = lighten(colorPrimary, 0.25),
    colorSurface = lighten(colorBg, 0.3),
    colorAccentWarm = colorPrimary,
    fontHeading,
    fontBody,
  } = theme;

  const vars: Record<string, string> = {
    // Backgrounds
    '--bg-page': colorBg,
    '--bg-page-dim': colorBg,
    '--bg-page-bright': lighten(colorBg, 0.12),
    '--bg-surface': colorSurface,
    '--bg-subtle': lighten(colorBg, 0.06),
    '--bg-overlay': withAlpha(colorBg, 0.7),

    // Text
    '--text-primary': lighten(colorSecondary, 0.15),
    '--text-secondary': colorAccentWarm,
    '--text-disabled': darken(colorAccentWarm, 0.45),
    '--text-inverse': colorBg,
    '--text-link': colorAccentWarm,

    // Borders
    '--border-color': withAlpha(colorAccentWarm, 0.25),
    '--border-focus': colorAccentWarm,

    // Brand
    '--brand-primary': colorPrimary,
    '--brand-on-primary': colorBg,
    '--brand-container': darken(colorPrimary, 0.15),
    '--brand-hover': lighten(colorPrimary, 0.15),
    '--brand-active': colorSecondary,

    // Accents
    '--accent-secondary': colorSecondary,
    '--accent-warm': colorAccentWarm,
    '--accent-tertiary': lighten(colorPrimary, 0.15),

    // Glass
    '--glass-border': withAlpha(colorAccentWarm, 0.15),
    '--glass-border-strong': withAlpha(colorAccentWarm, 0.25),
    '--glass-fill': withAlpha(colorSurface, 0.65),
    '--glass-fill-card': withAlpha(colorSurface, 0.7),
    '--glass-fill-modal': withAlpha(colorAccentWarm, 0.05),

    // Glow
    '--glow-primary': `0 0 40px ${withAlpha(colorAccentWarm, 0.3)}`,
    '--glow-accent': `0 0 40px ${withAlpha(colorSecondary, 0.25)}`,

    // `--font-sans`/`--font-body` are the aliases the landing page CSS modules read directly
    '--font-sans': `var(--font-heading)`,
    '--font-body': `var(--font-reading)`,
  };

  if (fontHeading) vars['--font-heading'] = `'${fontHeading}', Georgia, serif`;
  if (fontBody) vars['--font-reading'] = `'${fontBody}', sans-serif`;

  return vars;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useClientTheme(theme: ClientTheme | undefined | null): void {
  // useLayoutEffect (not useEffect) so the vars are set before paint — avoids a
  // flash of the fallback theme.
  useLayoutEffect(() => {
    if (!theme) return;

    const root = document.documentElement;
    const vars = buildThemeVars(theme);
    const appliedKeys = Object.keys(vars);

    for (const key of appliedKeys) {
      root.style.setProperty(key, vars[key]!);
    }

    return () => {
      for (const key of appliedKeys) {
        root.style.removeProperty(key);
      }
    };
  }, [theme]);
}
