import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--brand-primary)',
        'brand-secondary': 'var(--brand-secondary)',
        'brand-accent': 'var(--accent-color)',
        'neutral-900': '#111827',
        'neutral-800': '#1F2937',
        'neutral-700': '#374151',
        'neutral-600': '#4B5563',
        'neutral-500': '#6B7280',
        'neutral-400': '#9CA3AF',
        'neutral-300': '#D1D5DB',
        'neutral-200': '#E5E7EB',
        'neutral-100': '#F3F4F6',
        'status-purple': '#8B5CF6',
        'status-yellow': '#F59E0B',
        'status-green': '#10B981',
        'status-red': '#EF4444',
        'custom-gray-100': 'var(--color-custom-gray-100)',
        'custom-gray-150': 'var(--color-custom-gray-150)',
        'custom-gray-200': 'var(--color-custom-gray-200)',
        'custom-gray-400': 'var(--color-custom-gray-400)',
        'custom-gray': 'var(--color-custom-gray)',
        'custom-gray-600': 'var(--color-custom-gray-600)',
        'custom-gray-700': 'var(--color-custom-gray-700)',
        'custom-gray-800': 'var(--color-custom-gray-800)',
        'custom-gray-900': 'var(--color-custom-gray-900)',
        'custom-orange': 'var(--color-custom-orange)',
        'custom-yellow': 'var(--color-custom-yellow)',
        'team-golden-primary': 'var(--color-team-golden-primary)',
      },
      fontSize: {
        '2xs': '0.6875rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
