import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'FARI Twin Toolkit',
  description: 'Reusable libraries and services for FARI digital-twin projects.',
  lastUpdated: true,
  ignoreDeadLinks: true,
  outDir: 'dist',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Packages', link: '/packages/' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Introduction', link: '/guide/introduction' },
          { text: 'Getting started', link: '/guide/getting-started' },
          { text: 'End-to-end walkthrough', link: '/guide/end-to-end' },
          { text: 'Nuxt + Cesium setup', link: '/guide/nuxt-setup' },
          { text: 'Architecture & seams', link: '/guide/architecture' },
        ],
      },
      {
        text: 'Packages',
        items: [{ text: 'Overview', link: '/packages/' }],
      },
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/FARI-brussels/fari-twin-toolkit' }],
    search: { provider: 'local' },
  },
})
