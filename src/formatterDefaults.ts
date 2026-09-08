import { ref } from 'vue';
import type { AppSettings, IndentStyle } from '@/settings';

export const defaultIndentStyle = ref<IndentStyle>('2-spaces');
export const defaultPreserveComments = ref(true);
export const defaultPreserveBlankLines = ref(false);
export const defaultCaseSensitive = ref(false);
export const defaultSortKeys = ref(false);

export function applyFormatterDefaults(settings: AppSettings): void {
  defaultIndentStyle.value = settings.defaultIndentStyle;
  defaultPreserveComments.value = settings.defaultPreserveComments;
  defaultPreserveBlankLines.value = settings.defaultPreserveBlankLines;
  defaultCaseSensitive.value = settings.defaultCaseSensitive;
  defaultSortKeys.value = settings.defaultSortKeys;
}
