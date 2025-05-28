/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1a73e8',
          dark: '#0d5bdd',
        },
        accent: {
          DEFAULT: '#34a853',
          hover: '#2d9249',
        },
        danger: {
          DEFAULT: '#ea4335',
          hover: '#d33426',
        },
        textPrimary: '#212121',
        textSecondary: '#5f6368',
        borderColor: '#dadce0',
        evenRowBg: '#f8f9fb',
        mainBg: '#f5f7fa',
        contentBg: '#fff',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      spacing: {
        'standard': '20px',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 