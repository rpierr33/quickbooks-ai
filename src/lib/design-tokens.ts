import type React from "react";

/**
 * Ledgr Design Tokens
 *
 * Single source of truth for all design decisions.
 * These mirror the CSS custom properties defined in globals.css.
 * Use these in TypeScript where inline styles are unavoidable
 * (charts, canvas, dynamic values). Prefer Tailwind classes otherwise.
 *
 * Design rationale:
 * - Blue primary: universally trusted in financial products (Stripe, Chase, PayPal)
 * - Green/red semantic: accountants' universal language for money in/out
 * - Slate neutrals: calm, professional — recedes behind content
 * - 4px base grid: industry standard for density+readability balance
 * - Plus Jakarta Sans: friendly + modern, designed for dashboards and SaaS
 */

// ── Color Primitives ──────────────────────────────────────────────────────────

export const color = {
  // Blue — primary brand, interactive elements, links
  blue: {
    50:  '#EFF6FF',
    100: '#DBEAFE',
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Slate — neutral surfaces, text hierarchy, borders
  slate: {
    50:  '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },

  // Green — income, profit, success states
  green: {
    50:  '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
  },

  // Red — expenses, losses, errors
  red: {
    50:  '#FEF2F2',
    100: '#FEE2E2',
    200: '#FECACA',
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
  },

  // Amber — warnings, overdue, attention
  amber: {
    50:  '#FFFBEB',
    100: '#FEF3C7',
    200: '#FDE68A',
    400: '#FBBF24',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },

  // Purple — AI features, premium
  purple: {
    50:  '#F5F3FF',
    100: '#EDE9FE',
    400: '#A78BFA',
    500: '#8B5CF6',
    600: '#7C3AED',
    700: '#6D28D9',
  },

  white: '#FFFFFF',
  black: '#000000',
} as const;

// ── Semantic Color Tokens ─────────────────────────────────────────────────────

export const semantic = {
  // Text hierarchy (4-level: primary, secondary, muted, faint)
  text: {
    primary:   color.slate[900],  // Headlines, key numbers
    secondary: color.slate[700],  // Body copy, labels
    muted:     color.slate[500],  // Secondary labels, subtexts
    faint:     color.slate[400],  // Placeholders, disabled
    inverse:   color.white,       // Text on dark surfaces
    link:      color.blue[600],
    danger:    color.red[600],
    success:   color.green[700],
    warning:   color.amber[700],
  },

  // Surfaces
  surface: {
    page:     color.slate[50],   // Page background
    default:  color.white,       // Cards, panels
    elevated: color.white,       // Dropdowns, modals
    subtle:   color.slate[50],   // Inset areas, table stripes
    overlay:  'rgba(15, 23, 42, 0.5)',
  },

  // Borders
  border: {
    default:  color.slate[200],
    strong:   color.slate[300],
    subtle:   color.slate[100],
    focus:    color.blue[500],
  },

  // Interactive
  interactive: {
    primary:      color.blue[600],
    primaryHover: color.blue[700],
    primaryText:  color.white,
    ghost:        'transparent',
    ghostHover:   color.slate[100],
  },

  // Financial semantic colors
  financial: {
    income:         color.green[600],
    incomeLight:    color.green[50],
    incomeBorder:   color.green[200],
    expense:        color.red[500],
    expenseLight:   color.red[50],
    expenseBorder:  color.red[200],
    profit:         color.green[700],
    loss:           color.red[600],
    warning:        color.amber[600],
    warningLight:   color.amber[50],
    warningBorder:  color.amber[200],
  },
} as const;

// ── Spacing Scale (4px base) ──────────────────────────────────────────────────

export const spacing = {
  0:  '0px',
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

// ── Typography Scale ──────────────────────────────────────────────────────────

export const typography = {
  family: {
    sans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  },
  size: {
    display: '32px',  // Hero numbers on dashboard
    h1:      '24px',  // Page titles
    h2:      '20px',  // Section headers
    h3:      '16px',  // Card titles
    body:    '14px',  // Default body text
    small:   '12px',  // Labels, captions, meta
    micro:   '10px',  // Badge text, timestamps
  },
  weight: {
    light:    300,
    regular:  400,
    medium:   500,
    semibold: 600,
    bold:     700,
    extrabold: 800,
  },
  lineHeight: {
    tight:  1.25,
    snug:   1.375,
    normal: 1.5,
    relaxed: 1.625,
  },
  letterSpacing: {
    tight:   '-0.02em',
    normal:  '0em',
    label:   '0.06em',  // For uppercase labels
    caps:    '0.08em',  // For section headers
  },
} as const;

// ── Border Radius ─────────────────────────────────────────────────────────────

export const radius = {
  sm:  '6px',
  md:  '8px',
  lg:  '12px',
  xl:  '16px',
  '2xl': '20px',
  full: '9999px',
} as const;

// ── Shadows (layered — from product-ui.md) ───────────────────────────────────

export const shadow = {
  // Layered shadow formula from product-ui.md skill
  sm: `
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 1px 2px -1px rgba(0, 0, 0, 0.06),
    0 2px 4px 0 rgba(0, 0, 0, 0.04)
  `.trim(),
  md: `
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 2px 4px -1px rgba(0, 0, 0, 0.08),
    0 4px 12px 0 rgba(0, 0, 0, 0.06)
  `.trim(),
  lg: `
    0 0 0 1px rgba(0, 0, 0, 0.06),
    0 4px 8px -2px rgba(0, 0, 0, 0.10),
    0 12px 32px -4px rgba(0, 0, 0, 0.08)
  `.trim(),
  // Hover: each opacity + 0.02
  smHover: `
    0 0 0 1px rgba(0, 0, 0, 0.08),
    0 1px 2px -1px rgba(0, 0, 0, 0.08),
    0 2px 4px 0 rgba(0, 0, 0, 0.06)
  `.trim(),
} as const;

// ── Transitions ───────────────────────────────────────────────────────────────

export const transition = {
  fast:   '150ms ease',
  normal: '200ms ease',
  slow:   '300ms ease',
  // Named transitions for specific properties
  colors:    'color 150ms ease, background-color 150ms ease, border-color 150ms ease',
  shadow:    'box-shadow 200ms ease',
  transform: 'transform 200ms ease',
  opacity:   'opacity 150ms ease',
} as const;

// ── Z-Index Scale ─────────────────────────────────────────────────────────────

export const zIndex = {
  base:    0,
  raised:  10,
  dropdown: 20,
  sticky:  30,
  overlay: 40,
  modal:   50,
  toast:   60,
} as const;

// ── Chart colors (accessible, semantic) ──────────────────────────────────────

export const chartColors = {
  income:   color.green[500],
  expenses: color.red[400],
  neutral:  color.blue[500],
  forecast: color.blue[300],
  grid:     color.slate[100],
  axis:     color.slate[400],
  tooltip: {
    bg:     color.white,
    border: color.slate[200],
    text:   color.slate[900],
  },
} as const;

// ── Convenience: card style for inline usage (charts, etc.) ──────────────────

export const cardStyle: React.CSSProperties = {
  background: semantic.surface.default,
  border:     `1px solid ${semantic.border.default}`,
  borderRadius: radius.xl,
  boxShadow:  shadow.sm,
};
