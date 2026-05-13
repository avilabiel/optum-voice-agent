import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        optum: {
          blue: "#002677",
          orange: "#FF612B",
        },
      },
    },
  },
  plugins: [],
};

export default config;
