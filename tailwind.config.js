/** @type {import('tailwindcss').Config} */
module.exports = {
  // The root `npm run dev` command runs Next with apps/web as its app directory.
  // Keeping this root config makes Tailwind resolve the same sources in that mode.
  content: ['./apps/web/src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: { extend: {} },
  plugins: [],
};
