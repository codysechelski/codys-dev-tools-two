import { defineAsyncComponent } from 'vue';
import Attributions from './Attributions.vue';
import CronExpressionTool from './CronExpressionTool.vue';
import CssFormatter from './CssFormatter.vue';
import HtmlEncoderDecoder from './HtmlEncoderDecoder.vue';
import HtmlFormatter from './HtmlFormatter.vue';
import JavaScriptFormatter from './JavaScriptFormatter.vue';
import JsonFormatter from './JsonFormatter.vue';
import JsonYamlConverter from './JsonYamlConverter.vue';
import LoremIpsumGenerator from './LoremIpsumGenerator.vue';
import LuaFormatter from './LuaFormatter.vue';
import PythonFormatter from './PythonFormatter.vue';
import QrGenerator from './QrGenerator.vue';
import Settings from './Settings.vue';
import StringTemplateFormatter from './StringTemplateFormatter.vue';
import TextAnalyzer from './TextAnalyzer.vue';
import TimestampConverter from './TimestampConverter.vue';
import UrlEncoderDecoder from './UrlEncoderDecoder.vue';
import UuidGenerator from './UuidGenerator.vue';
import type { ToolDefinition } from './types';

export const attributionsTool: ToolDefinition = {
  id: 'attributions',
  name: 'Attributions',
  description: 'Open-source notices.',
  instructions: 'Review the open-source packages used by the app.',
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
    icon: 'code',
    component: JsonFormatter,
  },
  {
    id: 'css-formatter',
    name: 'CSS Formatter',
    section: 'Formatters',
    description: 'Format and minify CSS.',
    instructions: 'Paste CSS into the input editor, choose formatting options, then copy formatted or minified output.',
    icon: 'code',
    component: CssFormatter,
  },
  {
    id: 'javascript-formatter',
    name: 'JavaScript Formatter',
    section: 'Formatters',
    description: 'Format and compact JavaScript.',
    instructions: 'Paste JavaScript into the input editor, choose formatting options, then copy formatted or compact output.',
    icon: 'code',
    component: JavaScriptFormatter,
  },
  {
    id: 'html-formatter',
    name: 'HTML Formatter',
    section: 'Formatters',
    description: 'Format and minify HTML.',
    instructions: 'Paste HTML into the input editor, choose formatting options, then copy formatted or minified output.',
    icon: 'code',
    component: HtmlFormatter,
  },
  {
    id: 'python-formatter',
    name: 'Python Formatter',
    section: 'Formatters',
    description: 'Format and compact Python.',
    instructions: 'Paste Python into the input editor, choose formatting options, then copy formatted or compact output.',
    icon: 'code',
    component: PythonFormatter,
  },
  {
    id: 'lua-formatter',
    name: 'Lua Formatter',
    section: 'Formatters',
    description: 'Format Lua scripts.',
    instructions: 'Paste Lua into the input editor, choose indentation options, then copy formatted output.',
    icon: 'code',
    component: LuaFormatter,
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    section: 'Miscellaneous',
    description: 'Create identifiers quickly.',
    instructions: 'Generate one or more random UUID v4 identifiers, then copy the output from the editor.',
    icon: 'hashtag',
    component: UuidGenerator,
  },
  {
    id: 'json-yaml-converter',
    name: 'JSON/YAML Converter',
    section: 'Converters',
    description: 'Convert between JSON and YAML.',
    instructions: 'Paste JSON or YAML, choose the conversion direction, then copy the converted output from the editor.',
    icon: 'exchangeAlt',
    component: JsonYamlConverter,
  },
  {
    id: 'html-encoder-decoder',
    name: 'HTML Encoder/Decoder',
    section: 'Encoders/Decoders',
    description: 'Encode and decode HTML entities.',
    instructions: 'Encode text for safe HTML output or decode HTML entities back to readable text.',
    icon: 'code',
    component: HtmlEncoderDecoder,
  },
  {
    id: 'url-encoder-decoder',
    name: 'URL Encoder/Decoder',
    section: 'Encoders/Decoders',
    description: 'Encode and decode URLs and URL components.',
    instructions: 'Encode full URLs or URL components, decode escaped URL text, and choose form-style or RFC 3986 behavior.',
    icon: 'exchangeAlt',
    component: UrlEncoderDecoder,
  },
  {
    id: 'string-template-formatter',
    name: 'String Template Formatter',
    section: 'String Utilities',
    description: 'Format delimited rows with template placeholders.',
    instructions: 'Paste tabular or delimited data, define a format string, and automatically generate templated output.',
    icon: 'code',
    component: StringTemplateFormatter,
  },
  {
    id: 'qr-generator',
    name: 'QR Code Generator',
    section: 'Miscellaneous',
    description: 'Create PNG or SVG QR codes.',
    instructions: 'Choose a schema, enter the data to encode, preview the QR code, and download it as PNG or SVG.',
    icon: 'qrcode',
    component: QrGenerator,
  },
  {
    id: 'unicode-character-map',
    name: 'Unicode Character Map',
    section: 'Miscellaneous',
    description: 'Browse Unicode characters and code formats.',
    instructions: 'Filter by character set or Unicode name, inspect a character, then copy the character or encoded values.',
    icon: 'code',
    component: defineAsyncComponent(() => import('./UnicodeCharacterMap.vue')),
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    section: 'Date Utilities',
    description: 'Build, parse, and convert dates and timestamps.',
    instructions: 'Build a date from parts or parse a timestamp, then copy common timestamp formats and calendar facts.',
    icon: 'clock',
    component: TimestampConverter,
  },
  {
    id: 'text-analyzer',
    name: 'Text Analyzer',
    section: 'String Utilities',
    description: 'Analyze long-form text.',
    instructions: 'Paste text, inspect readability and character statistics, and review ranked word frequency.',
    icon: 'hashtag',
    component: TextAnalyzer,
  },
  {
    id: 'lorem-ipsum-generator',
    name: 'Lorem Ipsum Generator',
    section: 'String Utilities',
    description: 'Generate placeholder text and markup.',
    instructions: 'Generate words, paragraphs, list items, or definition lists with optional punctuation and inline HTML variation.',
    icon: 'code',
    component: LoremIpsumGenerator,
  },
  {
    id: 'cron-expression-tool',
    name: 'Cron Builder/Parser',
    section: 'Date Utilities',
    description: 'Build and explain cron schedules.',
    instructions: 'Type or build a standard cron expression, then inspect the parsed fields and upcoming local run times.',
    icon: 'clock',
    component: CronExpressionTool,
  },
];

export const allTools: ToolDefinition[] = [...tools, attributionsTool, settingsTool];
