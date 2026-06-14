/** @type {import('@docusaurus/plugin-content-docs').SidebarsConfig} */
const sidebars = {
  tutorialSidebar: [
    'intro',
    {
      label: 'Getting Started',
      items: [
        'getting-started/quickstart',
        'getting-started/installation',
        'getting-started/configuration',
      ],
    },
    {
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/services',
        'architecture/components',
        'architecture/data-flow',
      ],
    },
    {
      label: 'Features',
      items: [
        'features/barge-in',
        'features/speech-recognition',
        'features/parsing',
        'features/echo-cancellation',
      ],
    },
    {
      label: 'Monorepo',
      items: [
        'monorepo/structure',
        'monorepo/packages',
        'monorepo/development',
        'monorepo/builds',
      ],
    },
    {
      label: 'Guides',
      items: [
        'guides/tuning-barge-in',
        'guides/adding-languages',
        'guides/deployment',
        'guides/troubleshooting',
      ],
    },
    {
      label: 'API Reference',
      items: [
        'api/services',
        'api/components',
        'api/types',
      ],
    },
  ],
};

module.exports = sidebars;
