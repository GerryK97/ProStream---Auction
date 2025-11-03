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
        'brand-primary': '#4F46E5',
        'brand-secondary': '#10B981',
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
