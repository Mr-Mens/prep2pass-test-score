import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f4f7fb",
          100: "#e8eef6",
          200: "#cfd9e8",
          300: "#a7b8d4",
          400: "#7a91b8",
          500: "#567099",
          600: "#435a7d",
          700: "#374965",
          800: "#303e54",
          900: "#2b3547",
          950: "#1c2230",
        },
        accent: {
          DEFAULT: "#0f766e",
          foreground: "#f0fdfa",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 22px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
