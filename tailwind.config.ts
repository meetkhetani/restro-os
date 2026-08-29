import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/domain/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FAF8F5",
        surface: "#FFFFFF",
        brand: {
          50: "#FCF4F4",
          100: "#F7ECEB",
          200: "#E3BFBE",
          500: "#A90706",
          600: "#870504",
          700: "#690303",
          DEFAULT: "#A90706",
        },
        restro: {
          50: "#FAF8F5",
          100: "#F4EFEA",
          200: "#E8E3DC",
          300: "#D5CEC5",
          400: "#A8A096",
          500: "#7A736B",
          600: "#57524C",
          700: "#3D3934",
          800: "#262320",
          900: "#1A1817",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(26, 24, 23, 0.05)",
        card: "0 1px 3px 0 rgba(26, 24, 23, 0.06), 0 1px 2px 0 rgba(26, 24, 23, 0.04)",
        dialog: "0 10px 25px -5px rgba(26, 24, 23, 0.1), 0 8px 10px -6px rgba(26, 24, 23, 0.05)",
      },
      borderRadius: {
        lg: "8px",
        md: "6px",
        sm: "4px",
      },
    },
  },
  plugins: [],
};

export default config;
