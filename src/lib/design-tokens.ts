/** Centralized design tokens — single source of truth for the wealth companion UI. */
export const tokens = {
  radius: {
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    pill: '999px',
  },
  spacing: {
    page: '20px',
    section: '28px',
  },
  color: {
    canvas: '#F8F7F3',
    canvasDark: '#111113',
    surface: '#FFFFFF',
    surfaceDark: '#1B1B1F',
    ink: '#202124',
    inkMuted: '#6F7177',
    accent: '#6657E8',
    accentDark: '#7B6FF0',
    mint: '#57C7A3',
    peach: '#FF9B7A',
    yellow: '#F4C95D',
    success: '#35B77A',
    warning: '#E8A83E',
    danger: '#E76F6F',
    sky: '#6BB8E8',
  },
  shadow: {
    soft: '0 8px 30px rgba(0, 0, 0, 0.06)',
    fab: '0 8px 24px rgba(102, 87, 232, 0.35)',
    nav: '0 4px 24px rgba(0, 0, 0, 0.08)',
  },
  motion: {
    fast: '150ms',
    normal: '200ms',
    slow: '250ms',
    ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  },
} as const

export const chartColors = [
  '#6657E8',
  '#57C7A3',
  '#FF9B7A',
  '#F4C95D',
  '#6BB8E8',
  '#9B8AFB',
  '#E76F6F',
  '#35B77A',
] as const
