/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/embed/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      animation: {
        'bounce-delay-1': 'bounce 1.4s infinite 0.2s',
        'bounce-delay-2': 'bounce 1.4s infinite 0.4s',
      },
    },
  },
  plugins: [],
}

