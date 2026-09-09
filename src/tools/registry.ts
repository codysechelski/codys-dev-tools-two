import { defineAsyncComponent } from 'vue';
import Attributions from './Attributions.vue';
import BaseConverter from './BaseConverter.vue';
import CronExpressionTool from './CronExpressionTool.vue';
import CssFormatter from './CssFormatter.vue';
import HtmlEncoderDecoder from './HtmlEncoderDecoder.vue';
import HtmlFormatter from './HtmlFormatter.vue';
import JavaScriptFormatter from './JavaScriptFormatter.vue';
import JsonFormatter from './JsonFormatter.vue';
import JsonXmlConverter from './JsonXmlConverter.vue';
import JsonYamlConverter from './JsonYamlConverter.vue';
import LineDeduplicator from './LineDeduplicator.vue';
import LoremIpsumGenerator from './LoremIpsumGenerator.vue';
import LuaFormatter from './LuaFormatter.vue';
import MarkdownTableGenerator from './MarkdownTableGenerator.vue';
import PythonFormatter from './PythonFormatter.vue';
import QrGenerator from './QrGenerator.vue';
import Settings from './Settings.vue';
import StringTemplateFormatter from './StringTemplateFormatter.vue';
import TextAnalyzer from './TextAnalyzer.vue';
import TimestampConverter from './TimestampConverter.vue';
import UrlEncoderDecoder from './UrlEncoderDecoder.vue';
import UuidGenerator from './UuidGenerator.vue';
import XmlFormatter from './XmlFormatter.vue';
import type { ToolDefinition } from './types';

export const attributionsTool: ToolDefinition = {
  id: 'attributions',
  name: 'Attributions',
  description: 'Open-source notices.',
  instructions:
    'This app includes open-source software. Package license files are included in installed dependencies and packaged app metadata where supported by the build tooling.',
  icon: 'questionCircle',
  component: Attributions,
};

export const settingsTool: ToolDefinition = {
  id: 'settings',
  name: 'Settings',
  description: 'App preferences.',
  instructions: 'Adjust preferences for the app.',
  icon: 'cog',
  component: Settings,
};

export const tools: ToolDefinition[] = [
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    section: 'Formatters',
    description: 'Validate and format JSON payloads.',
    instructions: 'Paste JSON into the input editor, choose how the output should be generated, then copy the result from the output editor.',
    icon: 'bracketsCurly',
    component: JsonFormatter,
    keywords: ['json', 'validate', 'pretty print', 'minify', 'beautify'],
  },
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    section: 'Formatters',
    description: 'Format and minify CSS.',
    instructions: 'Paste CSS into the input editor, choose formatting options, then copy formatted or minified output.',
    icon: 'css3Alt',
    component: CssFormatter,
    keywords: ['css', 'stylesheet', 'style', 'minify', 'beautify', 'pretty print'],
  },
  {
    id: 'javascript-formatter',
    name: 'JavaScript Formatter',
    section: 'Formatters',
    description: 'Format and compact JavaScript.',
    instructions: 'Paste JavaScript into the input editor, choose formatting options, then copy formatted or compact output.',
    icon: 'jsSquare',
    component: JavaScriptFormatter,
    keywords: ['javascript', 'js', 'ecmascript', 'minify', 'beautify', 'pretty print'],
  },
  {
    id: 'html-formatter',
    name: 'HTML Formatter',
    section: 'Formatters',
    description: 'Format and minify HTML.',
    instructions: 'Paste HTML into the input editor, choose formatting options, then copy formatted or minified output.',
    icon: 'html5',
    component: HtmlFormatter,
    keywords: ['html', 'markup', 'minify', 'beautify', 'pretty print'],
  },
  {
    id: 'xml-formatter',
    name: 'XML Formatter',
    section: 'Formatters',
    description: 'Format and minify XML.',
    instructions: 'Paste XML into the input editor, choose formatting options, then copy formatted or minified output.',
    icon: 'sitemap',
    component: XmlFormatter,
    keywords: ['xml', 'markup', 'minify', 'beautify', 'pretty print'],
  },
  {
    id: 'python-formatter',
    name: 'Python Formatter',
    section: 'Formatters',
    description: 'Format and compact Python.',
    instructions: 'Paste Python into the input editor, choose formatting options, then copy formatted or compact output.',
    icon: 'python',
    component: PythonFormatter,
    keywords: ['python', 'py', 'indent', 'beautify'],
  },
  {
    id: 'lua-formatter',
    name: 'Lua Formatter',
    section: 'Formatters',
    description: 'Format Lua scripts.',
    instructions: 'Paste Lua into the input editor, choose indentation options, then copy formatted output.',
    icon: 'terminal',
    component: LuaFormatter,
    keywords: ['lua', 'script', 'indent', 'beautify'],
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    section: 'Miscellaneous',
    description: 'Create identifiers quickly.',
    instructions: 'Generate one or more random UUID v4 identifiers, then copy the output from the editor.',
    icon: 'fingerprint',
    component: UuidGenerator,
    keywords: ['uuid', 'guid', 'unique id', 'random id', 'identifier'],
  },
  {
    id: 'json-yaml-converter',
    name: 'JSON/YAML Converter',
    section: 'Converters',
    description: 'Convert between JSON and YAML.',
    instructions: 'Paste JSON or YAML, choose the conversion direction, then copy the converted output from the editor.',
    icon: 'retweet',
    component: JsonYamlConverter,
    keywords: ['json', 'yaml', 'yml', 'convert', 'converter'],
  },
  {
    id: 'json-xml-converter',
    name: 'JSON/XML Converter',
    section: 'Converters',
    description: 'Convert between JSON and XML.',
    instructions: 'Paste JSON or XML, choose the conversion direction, then copy the converted output from the editor.',
    icon: 'retweet',
    component: JsonXmlConverter,
    keywords: ['json', 'xml', 'convert', 'converter'],
  },
  {
    id: 'markdown-table-generator',
    name: 'Markdown Table Generator',
    section: 'Miscellaneous',
    description: 'Convert pasted tabular data into a markdown table.',
    instructions: 'Paste tabular data copied from a webpage, spreadsheet, CSV, TSV, or existing markdown table, then copy the generated markdown from the output editor.',
    icon: 'markdown',
    component: MarkdownTableGenerator,
    keywords: ['csv', 'tsv', 'excel', 'spreadsheet', 'table', 'markdown', 'md'],
  },
  {
    id: 'base-converter',
    name: 'Base Converter',
    section: 'Converters',
    description: 'Convert numbers between binary, octal, decimal, hex, and more.',
    instructions: 'Type a value into any base field and the others update automatically. Use the custom row to convert to or from any base from 2 to 36.',
    icon: 'calculator',
    component: BaseConverter,
    keywords: ['binary', 'octal', 'decimal', 'hexadecimal', 'hex', 'base36', 'radix', 'number base'],
  },
  {
    id: 'html-encoder-decoder',
    name: 'HTML Encoder/Decoder',
    section: 'Encoders/Decoders',
    description: 'Encode and decode HTML entities.',
    instructions: 'Encode text for safe HTML output or decode HTML entities back to readable text.',
    icon: 'code',
    component: HtmlEncoderDecoder,
    keywords: ['html', 'entities', 'escape', 'unescape', 'encode', 'decode'],
  },
  {
    id: 'url-encoder-decoder',
    name: 'URL Encoder/Decoder',
    section: 'Encoders/Decoders',
    description: 'Encode and decode URLs and URL components.',
    instructions: 'Encode full URLs or URL components, decode escaped URL text, and choose form-style or RFC 3986 behavior.',
    icon: 'link',
    component: UrlEncoderDecoder,
    keywords: ['url', 'uri', 'percent encoding', 'query string', 'encode', 'decode'],
  },
  {
    id: 'string-template-formatter',
    name: 'String Template Formatter',
    section: 'String Utilities',
    description: 'Format delimited rows with template placeholders.',
    instructions: 'Paste tabular or delimited data, define a format string, and automatically generate templated output.',
    icon: 'alignLeft',
    component: StringTemplateFormatter,
    keywords: ['template', 'mail merge', 'csv', 'tsv', 'delimited', 'placeholders'],
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    section: 'Miscellaneous',
    description: 'Create PNG or SVG QR codes.',
    instructions: 'Choose a schema, enter the data to encode, preview the QR code, and download it as PNG or SVG.',
    icon: 'qrcode',
    component: QrGenerator,
    keywords: ['qr', 'qr code', 'barcode', 'wifi', 'vcard'],
  },
  {
    id: 'unicode-character-map',
    name: 'Unicode Character Map',
    section: 'Miscellaneous',
    description: 'Browse Unicode characters and code formats.',
    instructions: 'Filter by character set or Unicode name, inspect a character, then copy the character or encoded values.',
    icon: 'language',
    component: defineAsyncComponent(() => import('./UnicodeCharacterMap.vue')),
    keywords: ['unicode', 'character', 'emoji', 'code point', 'utf-8', 'ascii'],
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    section: 'Date Utilities',
    description: 'Build, parse, and convert dates and timestamps.',
    instructions: 'Build a date from parts or parse a timestamp, then copy common timestamp formats and calendar facts.',
    icon: 'clock',
    component: TimestampConverter,
    keywords: ['timestamp', 'unix time', 'epoch', 'date', 'time', 'iso 8601'],
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    section: 'String Utilities',
    description: 'Analyze long-form text.',
    instructions: 'Paste text, inspect readability and character statistics, and review ranked word frequency.',
    icon: 'paragraph',
    component: TextAnalyzer,
    keywords: ['word count', 'character count', 'readability', 'statistics', 'frequency'],
  },
  {
    id: 'line-sorter-deduplicator',
    name: 'Line Sorter/Deduplicator',
    section: 'String Utilities',
    description: 'Sort and remove duplicate lines.',
    instructions: 'Paste lines of text, choose case sensitivity and a sort scheme from the toolbar, then sort or remove duplicate lines directly in the editor.',
    icon: 'sortAlt',
    component: LineDeduplicator,
    keywords: ['sort', 'dedupe', 'deduplicate', 'duplicate', 'lines', 'unique'],
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    section: 'String Utilities',
    description: 'Generate placeholder text and markup.',
    instructions: 'Generate words, paragraphs, list items, or definition lists with optional punctuation and inline HTML variation.',
    icon: 'quoteRight',
    component: LoremIpsumGenerator,
    keywords: ['lorem ipsum', 'placeholder text', 'dummy text', 'filler text'],
  },
  {
    id: 'cron-expression-tool',
    name: 'Cron Builder/Parser',
    section: 'Date Utilities',
    description: 'Build and explain cron schedules.',
    instructions: 'Type or build a standard cron expression, then inspect the parsed fields and upcoming local run times.',
    icon: 'syncAlt',
    component: CronExpressionTool,
    keywords: ['cron', 'crontab', 'schedule', 'cron expression'],
  },
];

export const allTools: ToolDefinition[] = [...tools, attributionsTool, settingsTool];
