import { defineConfig, presetAttributify, presetWind4 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind4(),
    presetAttributify(),
  ],
  theme: {
    animation: {
      'fade-in-up': 'fadeInUp 0.8s ease-out',
      'pulse-slow': 'pulse 3s ease-in-out infinite',
      'float': 'float 6s ease-in-out infinite',
    },
  },
  rules: [
    ['animate-fade-in-up', {
      animation: 'fadeInUp 0.8s ease-out',
    }],
    ['animation-delay-200', {
      'animation-delay': '0.2s',
    }],
    ['animation-delay-400', {
      'animation-delay': '0.4s',
    }],
    ['animate-float', {
      animation: 'float 6s ease-in-out infinite',
    }],
  ],
  shortcuts: {
    'glassmorphism': 'bg-white/10 backdrop-blur-sm border border-white/20',
    'button-hover': 'hover:bg-white/20 transform transition-all duration-300',
  },
  safelist: [
    'animate-fade-in-up',
    'animation-delay-200',
    'animation-delay-400',
    'animate-float',
  ],
})
