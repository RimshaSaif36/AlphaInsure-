/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef7ff",
          100: "#fdecff",
          200: "#fad8ff",
          300: "#f5bbff",
          400: "#ed8eff",
          500: "#e25dff",
          600: "#d936f5",
          700: "#bb1fd9",
          800: "#9a1bb1",
          900: "#801b90",
          950: "#4a0e5c",
        },
        dark: {
          50: "#f8f9fa",
          100: "#f1f3f4",
          200: "#e1e5e9",
          300: "#c4cdd5",
          400: "#a0aec0",
          500: "#68778d",
          600: "#4a5568",
          700: "#2d3748",
          800: "#1a202c",
          900: "#0d1117",
          950: "#020204",
        },
        pink: {
          50: "#fef7ff",
          100: "#fdecff",
          200: "#fad8ff",
          300: "#f5bbff",
          400: "#ed8eff",
          500: "#e25dff",
          600: "#d936f5",
          700: "#bb1fd9",
          800: "#9a1bb1",
          900: "#801b90",
          950: "#4a0e5c",
        },
        danger: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "gradient-pink-dark":
          "linear-gradient(135deg, #d936f5 0%, #1a202c 100%)",
        "gradient-dark-pink":
          "linear-gradient(135deg, #0d1117 0%, #9a1bb1 100%)",
        "gradient-pink-black":
          "linear-gradient(45deg, #e25dff 0%, #000000 50%, #bb1fd9 100%)",
        "gradient-cosmic":
          "linear-gradient(135deg, #0d1117 0%, #4a0e5c 25%, #9a1bb1 50%, #d936f5 75%, #fef7ff 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        glow: "glow 2s ease-in-out infinite alternate",
        shimmer: "shimmer 2s linear infinite",
        sparkle: "sparkle 1.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translatey(0px)" },
          "50%": { transform: "translatey(-20px)" },
        },
        glow: {
          from: {
            boxShadow: "0 0 5px #d936f5, 0 0 10px #d936f5, 0 0 15px #d936f5",
          },
          to: {
            boxShadow: "0 0 10px #d936f5, 0 0 20px #d936f5, 0 0 30px #d936f5",
          },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "0", transform: "scale(0)" },
          "50%": { opacity: "1", transform: "scale(1)" },
        },
      },
      fontFamily: {
        display: ["Inter", "ui-sans-serif", "system-ui"],
      },
      boxShadow: {
        pink: "0 0 20px rgba(217, 54, 245, 0.3)",
        "pink-lg": "0 0 40px rgba(217, 54, 245, 0.4)",
        dark: "0 4px 20px rgba(0, 0, 0, 0.5)",
        "inner-pink": "inset 0 2px 4px rgba(217, 54, 245, 0.2)",
      },
    },
  },
  plugins: [],
};
