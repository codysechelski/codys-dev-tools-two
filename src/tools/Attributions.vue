<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/components/AppCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import type { IconName } from '@/icons';

interface Attribution {
  name: string;
  license: string;
  description: string;
  repoUrl: string;
}

const attributions: Attribution[] = [
  {
    name: '@unicode/unicode-17.0.0',
    license: 'MIT License',
    description: 'Provides the full Unicode block and character data used by the Unicode Character Map.',
    repoUrl: 'https://github.com/node-unicode/unicode-17.0.0',
  },
  {
    name: '@vuepic/vue-datepicker',
    license: 'MIT License',
    description: 'Powers the date and time picker in the Timestamp Converter.',
    repoUrl: 'https://github.com/Vuepic/vue-datepicker',
  },
  {
    name: 'CodeMirror',
    license: 'MIT License',
    description:
      'Powers the shared text editor: line numbers, indentation, and syntax highlighting for JavaScript, JSON, Python, HTML, CSS, XML, and Lua.',
    repoUrl: 'https://github.com/codemirror/dev',
  },
  {
    name: 'Electron',
    license: 'MIT License',
    description: 'Packages and runs the macOS and Windows desktop app.',
    repoUrl: 'https://github.com/electron/electron',
  },
  {
    name: 'fast-xml-parser',
    license: 'MIT License',
    description: 'Parses and builds XML for the JSON/XML Converter.',
    repoUrl: 'https://github.com/NaturalIntelligence/fast-xml-parser',
  },
  {
    name: 'Lezer',
    license: 'MIT License',
    description: 'Supplies the syntax-highlighting tags used by the shared text editor.',
    repoUrl: 'https://github.com/lezer-parser/highlight',
  },
  {
    name: 'marked',
    license: 'MIT License',
    description: 'Renders the Markdown Table Generator\'s live table preview.',
    repoUrl: 'https://github.com/markedjs/marked',
  },
  {
    name: 'qrcode',
    license: 'MIT License',
    description: 'Generates PNG and SVG QR codes.',
    repoUrl: 'https://github.com/soldair/node-qrcode',
  },
  {
    name: 'unicode-name',
    license: 'MIT License',
    description: 'Resolves Unicode character names for the Unicode Character Map.',
    repoUrl: 'https://github.com/janlelis/unicode-name.js',
  },
  {
    name: 'unicode-properties',
    license: 'MIT License',
    description: 'Resolves Unicode general categories for the Unicode Character Map.',
    repoUrl: 'https://github.com/devongovett/unicode-properties',
  },
  {
    name: 'Vue',
    license: 'MIT License',
    description: 'Used for the application UI.',
    repoUrl: 'https://github.com/vuejs/core',
  },
  {
    name: 'YAML',
    license: 'ISC License',
    description: 'Parses and stringifies YAML for the JSON/YAML Converter.',
    repoUrl: 'https://github.com/eemeli/yaml',
  },
];

const sortedAttributions = computed(() =>
  [...attributions].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
);

function iconForRepo(repoUrl: string): IconName {
  const host = new URL(repoUrl).hostname;
  if (host === 'github.com') return 'github';
  if (host === 'bitbucket.org') return 'bitbucket';
  return 'globe';
}
</script>

<template>
  <div class="attribution-list">
    <AppCard v-for="attribution in sortedAttributions" :key="attribution.name" :heading="attribution.name" :subheading="attribution.license">
      <p>{{ attribution.description }}</p>
      <template #footer>
        <a class="attribution-list__link" :href="attribution.repoUrl" target="_blank" rel="noopener noreferrer">
          <AppIcon :name="iconForRepo(attribution.repoUrl)" />
          View Repository
        </a>
      </template>
    </AppCard>
  </div>
</template>
