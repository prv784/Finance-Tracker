/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary:   { 50:'#f0f4ff', 100:'#e0e9ff', 500:'#667eea', 600:'#5a67d8', 700:'#4c51bf' },
        secondary: { 500:'#764ba2' },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        'gradient-income':  'linear-gradient(135deg,#11998e 0%,#38ef7d 100%)',
        'gradient-expense': 'linear-gradient(135deg,#f5576c 0%,#f093fb 100%)',
        'gradient-savings': 'linear-gradient(135deg,#4facfe 0%,#00f2fe 100%)',
        'gradient-ai':      'linear-gradient(135deg,#a18cd1 0%,#fbc2eb 100%)',
      },
      boxShadow: {
        card:       '0 4px 20px rgba(0,0,0,0.08)',
        'card-hover':'0 8px 30px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':  'fadeIn .3s ease-in-out',
        'slide-up': 'slideUp .3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%':{ opacity:'0' }, '100%':{ opacity:'1' } },
        slideUp: { '0%':{ transform:'translateY(20px)', opacity:'0' }, '100%':{ transform:'translateY(0)', opacity:'1' } },
      },
    },
  },
  plugins: [],
};
