import jannchie from '@jannchie/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(jannchie({ unocss: true }))
