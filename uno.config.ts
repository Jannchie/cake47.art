import { defineConfig, presetAttributify, presetIcons, presetUno } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
        'pointer-events': 'none',
      },
      collections: {
        'ri': () => import('@iconify-json/ri/icons.json').then(i => i.default as any),
        'simple-icons': () => import('@iconify-json/simple-icons/icons.json').then(i => i.default as any),
      },
    }),
  ],
})
