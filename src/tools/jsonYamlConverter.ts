import YAML from 'yaml';
import { sortJsonKeys } from './jsonFormatter';

export type JsonYamlDirection = 'json-to-yaml' | 'yaml-to-json';
export type JsonYamlIndentation = '2-spaces' | '4-spaces' | 'tabs';
export type YamlLineWidth = 'preserve' | 'wrap-80' | 'wrap-120';

export interface JsonYamlConverterOptions {
  direction: JsonYamlDirection;
  jsonIndentation: JsonYamlIndentation;
  yamlLineWidth: YamlLineWidth;
  sortKeys: boolean;
}

export interface JsonYamlConverterResult {
  output: string;
  error: string;
}

export function convertJsonYaml(input: string, options: JsonYamlConverterOptions): JsonYamlConverterResult {
  if (!input.trim()) {
    return { output: '', error: '' };
  }

  try {
    if (options.direction === 'json-to-yaml') {
      const parsed = JSON.parse(input) as unknown;
      const normalized = options.sortKeys ? sortJsonKeys(parsed) : parsed;

      return {
        output: YAML.stringify(normalized, {
          lineWidth: getYamlLineWidth(options.yamlLineWidth),
          sortMapEntries: false,
        }),
        error: '',
      };
    }

    const parsed = YAML.parse(input) as unknown;
    const normalized = options.sortKeys ? sortJsonKeys(parsed) : parsed;

    return {
      output: JSON.stringify(normalized, null, getJsonIndentation(options.jsonIndentation)),
      error: '',
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unable to convert input',
    };
  }
}

function getJsonIndentation(indentation: JsonYamlIndentation): number | string {
  if (indentation === '4-spaces') return 4;
  if (indentation === 'tabs') return '\t';
  return 2;
}

function getYamlLineWidth(lineWidth: YamlLineWidth): number {
  if (lineWidth === 'wrap-80') return 80;
  if (lineWidth === 'wrap-120') return 120;
  return 0;
}
