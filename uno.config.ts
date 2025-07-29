import * as fs from 'node:fs'
import { rokuPreset } from '@roku-ui/preset'
import { defineConfig } from 'unocss'

const file = fs.readFileSync('node_modules/@roku-ui/vue/dist/index.js', 'utf8')
export default defineConfig({
  presets: [
    rokuPreset(),
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
  content: {
    inline: [file],
  },
})
