/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        botanical: {
          bg:          '#F9F8F4',
          fg:          '#2D3A31',
          primary:     '#8C9A84',
          secondary:   '#DCCFC2',
          border:      '#E6E2DA',
          terra:       '#C27B66',
          card:        '#F2F0EB',
          white:       '#FFFFFF',
        }
      },
      fontFamily: {
        serif:  ['"Playfair Display"', 'Georgia', 'serif'],
        sans:   ['"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        arch: '200px 200px 0 0',
      },
      boxShadow: {
        soft:  '0 4px 6px -1px rgba(45,58,49,0.05)',
        med:   '0 10px 15px -3px rgba(45,58,49,0.07)',
        large: '0 20px 40px -10px rgba(45,58,49,0.10)',
        xl:    '0 25px 50px -12px rgba(45,58,49,0.15)',
      },
      transitionTimingFunction: {
        'botanical': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      }
    },
  },
  plugins: [],
}
