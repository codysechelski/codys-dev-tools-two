import { XMLBuilder, XMLParser, XMLValidator } from 'fast-xml-parser';
import { sortJsonKeys } from './jsonFormatter';

export type JsonXmlDirection = 'json-to-xml' | 'xml-to-json';
export type JsonXmlIndentation = '2-spaces' | '4-spaces' | 'tabs';

export interface JsonXmlConverterOptions {
  direction: JsonXmlDirection;
  indentation: JsonXmlIndentation;
  rootElement: string;
  sortKeys: boolean;
  includeAttributes: boolean;
}

export interface JsonXmlConverterResult {
  output: string;
  error: string;
}

const ATTRIBUTE_NAME_PREFIX = '@_';

export function convertJsonXml(input: string, options: JsonXmlConverterOptions): JsonXmlConverterResult {
  if (!input.trim()) {
    return { output: '', error: '' };
  }

  try {
    if (options.direction === 'json-to-xml') {
      const parsed = JSON.parse(input) as unknown;
      const withoutAttributes = options.includeAttributes ? parsed : stripAttributeKeys(parsed);
      const normalized = options.sortKeys ? sortJsonKeys(withoutAttributes) : withoutAttributes;
      const wrapped = wrapForXml(normalized, options.rootElement.trim() || 'root');

      const builder = new XMLBuilder({
        format: true,
        indentBy: getIndentString(options.indentation),
        ignoreAttributes: !options.includeAttributes,
        attributeNamePrefix: ATTRIBUTE_NAME_PREFIX,
        suppressEmptyNode: true,
      });

      return { output: builder.build(wrapped).trim(), error: '' };
    }

    const validation = XMLValidator.validate(input);
    if (validation !== true) {
      return { output: '', error: `${validation.err.msg} (line ${validation.err.line}, column ${validation.err.col})` };
    }

    const parser = new XMLParser({
      ignoreAttributes: !options.includeAttributes,
      attributeNamePrefix: ATTRIBUTE_NAME_PREFIX,
    });
    const parsed: unknown = parser.parse(input);
    const normalized = options.sortKeys ? sortJsonKeys(parsed) : parsed;

    return { output: JSON.stringify(normalized, null, getJsonIndentation(options.indentation)), error: '' };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unable to convert input',
    };
  }
}

function stripAttributeKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripAttributeKeys);
  }

  if (isPlainObject(value)) {
    return Object.keys(value)
      .filter((key) => !key.startsWith(ATTRIBUTE_NAME_PREFIX))
      .reduce<Record<string, unknown>>((stripped, key) => {
        stripped[key] = stripAttributeKeys(value[key]);
        return stripped;
      }, {});
  }

  return value;
}

function wrapForXml(value: unknown, rootElement: string): Record<string, unknown> {
  if (Array.isArray(value)) {
    return { [rootElement]: { item: value } };
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 1) {
      const soleValue = value[keys[0]];
      return Array.isArray(soleValue) ? { [rootElement]: { [keys[0]]: soleValue } } : value;
    }
  }

  return { [rootElement]: value };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getIndentString(indentation: JsonXmlIndentation): string {
  if (indentation === '4-spaces') return '    ';
  if (indentation === 'tabs') return '\t';
  return '  ';
}

function getJsonIndentation(indentation: JsonXmlIndentation): number | string {
  if (indentation === '4-spaces') return 4;
  if (indentation === 'tabs') return '\t';
  return 2;
}
