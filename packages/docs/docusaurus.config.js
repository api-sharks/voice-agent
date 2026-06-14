// @ts-check
const { themes } = require('prism-react-renderer');
const lightTheme = themes.github;
const darkTheme = themes.dracula;

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Voice AI Form Advanced',
  tagline: 'Angular voice-driven form collection with barge-in support',
  favicon: 'img/favicon.ico',
  url: 'https://yourusername.github.io',
  baseUrl: '/voice-agent/',
  organizationName: 'yourusername',
  projectName: 'voice-agent',
  trailingSlash: false,
  deploymentBranch: 'gh-pages',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl: 'https://github.com/yourusername/voice-agent/tree/main/packages/docs',
          versions: {
            current: {
              label: 'Next',
              path: 'next',
              badge: true,
            },
          },
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],
  themeConfig: {
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    image: 'img/social-card.jpg',
    navbar: {
      title: 'Voice AI Form',
      logo: {
        alt: 'Voice AI Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
        },
        {
          href: 'https://github.com/yourusername/voice-agent',
          label: 'GitHub',
          position: 'right',
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
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture',
            },
            {
              label: 'Barge-in Guide',
              to: '/docs/features/barge-in',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub Issues',
              href: 'https://github.com/yourusername/voice-agent/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/yourusername/voice-agent',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Voice Agent. Built with Docusaurus.`,
    },
    prism: {
      theme: lightTheme,
      darkTheme: darkTheme,
      additionalLanguages: ['bash', 'typescript', 'html'],
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  },
};

module.exports = config;
