import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Premium minimalist palette - black, white, gold
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        cream: {
          50: '#fefdfb',
          100: '#fef9f3',
          200: '#fef4e6',
          300: '#fdefd9',
          400: '#fce9cc',
          500: '#fbe4bf',
        },
      },
      // Premium typography
      fontSize: {
        'hero': ['5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '300' }],
        'display': ['4rem', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '300' }],
      },
      fontWeight: {
        'extralight': '200',
        'light': '300',
      },
      letterSpacing: {
        'tighter': '-0.04em',
        'tight': '-0.02em',
      },
      // Minimal rounded corners
      borderRadius: {
        'sm': '2px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
      },
      // Premium subtle shadows
      boxShadow: {
        'premium': '0 1px 3px rgba(0, 0, 0, 0.05)',
        'premium-md': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'premium-lg': '0 8px 30px rgba(0, 0, 0, 0.12)',
        'gold-glow': '0 0 20px rgba(202, 138, 4, 0.3)',
      },
      // Smooth transitions
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      // Backdrop blur for glassmorphism
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        blob: "blob 7s infinite",
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
