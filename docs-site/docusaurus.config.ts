import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Token Saver',
  tagline: 'Menos contexto. Modelo certo. Agentes mais eficientes.',
  favicon: 'img/favicon.ico',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://token-saver.local',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Token Saver',
      logo: {
        alt: 'Baú dourado do Token Saver',
        src: 'img/token-saver-hero.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'developerSidebar',
          position: 'left',
          label: 'Documentação',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Começar',
              to: '/docs/intro',
            },
            {
              label: 'Uso diário',
              to: '/docs/daily-use',
            },
          ],
        },
        {
          title: 'Conceitos',
          items: [
            {
              label: 'Classificação de tarefas',
              to: '/docs/concepts/task-classification',
            },
            {
              label: 'Roteamento de modelos',
              to: '/docs/concepts/model-routing',
            },
            {
              label: 'Automação Codex',
              to: '/docs/codex-automation',
            },
          ],
        },
        {
          title: 'Desenvolvimento',
          items: [
            {
              label: 'Contribuindo',
              to: '/docs/contributing',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Token Saver MCP.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
