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
        primary: {
          DEFAULT: "#0A2540",
          50: "#EBF0F5",
          100: "#C8D5E3",
          200: "#91ABC7",
          300: "#5A81AB",
          400: "#325A82",
          500: "#0A2540",
          600: "#091F36",
          700: "#07192B",
          800: "#051221",
          900: "#030C16",
        },
        secondary: {
          DEFAULT: "#1E40AF",
          50: "#EFF3FF",
          100: "#DBE3FE",
          200: "#BFCDFE",
          300: "#93AAFD",
          400: "#6080FA",
          500: "#1E40AF",
          600: "#1A389B",
          700: "#162F82",
        },
        accent: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
        },
        danger: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-instrument)", "var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.7s ease-out forwards",
        "float-slow": "float-slow 6s ease-in-out infinite",
        "float-medium": "float-slow 4.5s ease-in-out infinite reverse",
      },
    },
  },
  plugins: [],
};

export default config;
