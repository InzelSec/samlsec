import type { Config } from 'tailwindcss';

/**
 * Colors are declared as CSS custom properties in globals.css so that the
 * light and dark themes swap via [data-theme]. Tailwind here only references
 * the tokens — no hex ever lives in a component.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx,md,mdx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        line: 'var(--line)',
        blueprint: 'var(--blueprint)',
        'blueprint-soft': 'var(--blueprint-soft)',
        signed: 'var(--signed)',
        unsigned: 'var(--unsigned)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        // A modest scale (~1.2 minor third) tuned per Elements of Typographic Style.
        'display': ['2.75rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'title': ['1.9rem', { lineHeight: '1.15', letterSpacing: '-0.015em' }],
        'heading': ['1.35rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'subhead': ['1.1rem', { lineHeight: '1.4' }],
      },
      maxWidth: {
        prose: '68ch',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(26, 31, 43, 0.04), 0 1px 1px rgba(26, 31, 43, 0.03)',
        lift: '0 6px 24px -12px rgba(26, 31, 43, 0.18)',
      },
      keyframes: {
        'anatomy-in': {
          '0%': { opacity: '0', backgroundColor: 'transparent' },
          '100%': { opacity: '1' },
        },
        'draw-line': {
          '0%': { strokeDashoffset: '100%' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        'anatomy-in': 'anatomy-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
