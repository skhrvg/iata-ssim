import type { DefaultTheme } from 'vitepress'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'

function guideSidebar(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Overview',
      items: [
        { text: 'Getting Started', link: '/overview/getting-started' },
        { text: 'Installation', link: '/overview/installation' },
        { text: 'Validation', link: '/overview/validation' },
        { text: 'Roadmap', link: '/overview/roadmap' },
      ],
    },
    {
      text: 'Schedule Data Set (Chapter 7)',
      items: [
        { text: 'What is SDS?', link: '/sds/' },
        { text: 'Parsing SDS', link: '/sds/parsing' },
        { text: 'Field Reference', link: '/sds/field-reference' },
        { text: 'Error Handling', link: '/sds/error-handling' },
      ],
    },
  ]
}

export default defineConfig({
  title: 'iata-ssim',
  description: 'Zero-dependency TypeScript parser for IATA SSIM (Standard Schedules Information Manual) data formats',
  cleanUrls: true,
  lastUpdated: true,

  vite: {
    resolve: {
      alias: [
        { find: 'iata-ssim/sds', replacement: fileURLToPath(new URL('../../src/sds/index.ts', import.meta.url)) },
        { find: /^iata-ssim$/, replacement: fileURLToPath(new URL('../../src/index.ts', import.meta.url)) },
      ],
    },
    ssr: {
      noExternal: ['iata-ssim'],
    },
  },

  themeConfig: {
    nav: [
      {
        text: 'Guide',
        link: '/overview/getting-started',
        activeMatch: '/(overview|sds)/',
      },
      { text: 'API', link: '/api/', activeMatch: '/api/' },
      { text: 'Playground', link: '/playground' },
    ],

    sidebar: {
      // Combined sidebar shown on both /overview/* and /sds/* — guide content.
      '/overview/': guideSidebar(),
      '/sds/': guideSidebar(),
      '/api/': [
        {
          text: 'API',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'Functions', link: '/api/functions' },
            { text: 'Types', link: '/api/types' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/skhrvg/iata-ssim' },
    ],

    search: {
      provider: 'local',
    },
  },
})
