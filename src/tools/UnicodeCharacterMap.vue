<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppButton from '@/components/AppButton.vue';
import DataList from '@/components/DataList.vue';
import AppModal from '@/components/AppModal.vue';
import AppSelect from '@/components/forms/AppSelect.vue';
import AppTextInput from '@/components/forms/AppTextInput.vue';
import ToolToolbar from '@/components/ToolToolbar.vue';
import {
  ALL_UNICODE_BLOCK_VALUE,
  MAX_ALL_SEARCH_RESULTS,
  getCharactersForBlock,
  searchUnicodeCharacters,
  unicodeBlocks,
  type UnicodeCharacterInfo,
} from './unicodeCharacterMap';

const selectedBlock = ref('basic-latin');
const search = ref('');
const selectedCharacter = ref<UnicodeCharacterInfo | null>(null);
const copiedKey = ref('');

const blockOptions = [{ label: 'All', value: ALL_UNICODE_BLOCK_VALUE }, ...unicodeBlocks.map((block) => ({ label: block.label, value: block.value }))];
const query = computed(() => search.value.trim());
const characters = computed(() => {
  if (selectedBlock.value === ALL_UNICODE_BLOCK_VALUE) {
    return query.value ? searchUnicodeCharacters(query.value).characters : [];
  }

  return getCharactersForBlock(selectedBlock.value);
});
const filteredCharacters = computed(() => {
  if (selectedBlock.value === ALL_UNICODE_BLOCK_VALUE) return characters.value;

  const normalizedQuery = query.value.toLowerCase();
  if (!normalizedQuery) return characters.value;

  return characters.value.filter((character) => {
    return character.name.toLowerCase().includes(normalizedQuery) || character.code.toLowerCase().includes(normalizedQuery) || character.character === query.value;
  });
});
const searchNote = computed(() => {
  if (selectedBlock.value === ALL_UNICODE_BLOCK_VALUE && !query.value) return 'Enter a search term, character, or code to search all Unicode blocks.';
  if (selectedBlock.value === ALL_UNICODE_BLOCK_VALUE && filteredCharacters.value.length >= MAX_ALL_SEARCH_RESULTS) {
    return `Showing the first ${MAX_ALL_SEARCH_RESULTS} matches. Refine the search to narrow results.`;
  }
  if (!filteredCharacters.value.length) return 'No characters match the current filters.';

  return '';
});
const copyableAttributes = computed(() => {
  if (!selectedCharacter.value) return [];

  return [
    { label: 'HTML Code', value: selectedCharacter.value.htmlCode },
    { label: 'CSS Code', value: selectedCharacter.value.cssCode },
    { label: 'Unicode Code', value: selectedCharacter.value.code },
    { label: 'Binary', value: selectedCharacter.value.binary },
    { label: 'Decimal', value: selectedCharacter.value.decimal },
    { label: 'Octal', value: selectedCharacter.value.octal },
    { label: 'Hexadecimal', value: selectedCharacter.value.hexadecimal },
  ];
});

watch(search, (value) => {
  const trimmed = value.trim();
  if (!trimmed) return;

  const currentResults = selectedBlock.value === ALL_UNICODE_BLOCK_VALUE ? [] : searchUnicodeCharacters(trimmed, selectedBlock.value).characters;
  if (currentResults.length) return;

  const allResults = searchUnicodeCharacters(trimmed);
  selectedBlock.value = allResults.matchedBlockValues.length === 1 ? allResults.matchedBlockValues[0] : ALL_UNICODE_BLOCK_VALUE;
});

function openCharacter(character: UnicodeCharacterInfo): void {
  copiedKey.value = '';
  selectedCharacter.value = character;
}

function closeCharacter(): void {
  selectedCharacter.value = null;
}

async function copyValue(value: string, key: string): Promise<void> {
  await navigator.clipboard.writeText(value);
  copiedKey.value = key;
  window.setTimeout(() => {
    if (copiedKey.value === key) copiedKey.value = '';
  }, 1200);
}
</script>

<template>
  <section class="unicode-tool">
    <ToolToolbar class="unicode-tool__options">
      <AppSelect v-model="selectedBlock" label="Character set" :options="blockOptions" />
      <AppTextInput v-model="search" label="Search" placeholder="Search by Unicode name, code, or character" />
    </ToolToolbar>

    <p v-if="searchNote" class="unicode-tool__note">{{ searchNote }}</p>

    <div class="unicode-grid" role="list" aria-label="Unicode characters">
      <button v-for="character in filteredCharacters" :key="character.code" class="unicode-card" type="button" role="listitem" @click="openCharacter(character)">
        <span class="unicode-card__glyph" :class="{ 'unicode-card__glyph--label': character.displayCharacter.length > 2 }">
          {{ character.displayCharacter }}
        </span>
        <span class="unicode-card__code">{{ character.code }}</span>
      </button>
    </div>

    <AppModal
      :open="Boolean(selectedCharacter)"
      :title="selectedCharacter?.name ?? ''"
      :subtitle="selectedCharacter?.code"
      icon="code"
      @close="closeCharacter"
    >
      <div v-if="selectedCharacter" class="unicode-detail">
        <section class="unicode-detail__preview-panel">
          <AppButton class="unicode-detail__copy-character" variant="secondary" icon="copy" @click="copyValue(selectedCharacter.character, 'character')">
            {{ copiedKey === 'character' ? 'Copied' : 'Copy' }}
          </AppButton>
          <div class="unicode-detail__glyph" :class="{ 'unicode-detail__glyph--label': selectedCharacter.displayCharacter.length > 2 }">
            {{ selectedCharacter.displayCharacter }}
          </div>
        </section>

        <section class="unicode-detail__meta-panel">
          <dl class="unicode-detail__facts">
            <div>
              <dt>Block</dt>
              <dd>{{ selectedCharacter.block }}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{{ selectedCharacter.categoryLabel }} · {{ selectedCharacter.category }}</dd>
            </div>
          </dl>

          <DataList class="unicode-attributes">
            <div v-for="attribute in copyableAttributes" :key="attribute.label" class="data-list__row unicode-attribute">
              <div>
                <span>{{ attribute.label }}</span>
                <code>{{ attribute.value }}</code>
              </div>
              <AppButton variant="muted" icon="copy" @click="copyValue(attribute.value, attribute.label)">
                {{ copiedKey === attribute.label ? 'Copied' : 'Copy' }}
              </AppButton>
            </div>
          </DataList>
        </section>
      </div>
    </AppModal>
  </section>
</template>
