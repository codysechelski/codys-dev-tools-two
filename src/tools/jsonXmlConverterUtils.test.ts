import { describe, expect, it } from 'vitest';
import { convertJsonXml } from './jsonXmlConverter';

const jsonToXml = { direction: 'json-to-xml' as const, indentation: '2-spaces' as const, rootElement: 'root', sortKeys: false, includeAttributes: true };
const xmlToJson = { direction: 'xml-to-json' as const, indentation: '2-spaces' as const, rootElement: 'root', sortKeys: false, includeAttributes: true };

describe('convertJsonXml json-to-xml', () => {
  it('uses a single top-level key as the root element', () => {
    const result = convertJsonXml('{"note":{"to":"Bob"}}', jsonToXml);
    expect(result.error).toBe('');
    expect(result.output).toBe('<note>\n  <to>Bob</to>\n</note>');
  });

  it('wraps input with multiple top-level keys under the configured root element', () => {
    const result = convertJsonXml('{"a":1,"b":2}', jsonToXml);
    expect(result.output).toBe('<root>\n  <a>1</a>\n  <b>2</b>\n</root>');
  });

  it('nests a top-level array under the root element instead of producing sibling roots', () => {
    const result = convertJsonXml('[1,2,3]', jsonToXml);
    expect(result.output).toBe('<root>\n  <item>1</item>\n  <item>2</item>\n  <item>3</item>\n</root>');
  });

  it('nests an array that is the value of a single top-level key', () => {
    const result = convertJsonXml('{"items":[1,2]}', jsonToXml);
    expect(result.output).toBe('<root>\n  <items>1</items>\n  <items>2</items>\n</root>');
  });

  it('writes object properties as XML attributes when enabled', () => {
    const result = convertJsonXml('{"note":{"@_id":"1","to":"Bob"}}', jsonToXml);
    expect(result.output).toBe('<note id="1">\n  <to>Bob</to>\n</note>');
  });

  it('drops attribute-prefixed properties when attributes are disabled', () => {
    const result = convertJsonXml('{"note":{"@_id":"1","to":"Bob"}}', { ...jsonToXml, includeAttributes: false });
    expect(result.output).toBe('<note>\n  <to>Bob</to>\n</note>');
  });

  it('sorts keys when requested', () => {
    const result = convertJsonXml('{"note":{"to":"Bob","from":"Amy"}}', { ...jsonToXml, sortKeys: true });
    expect(result.output).toBe('<note>\n  <from>Amy</from>\n  <to>Bob</to>\n</note>');
  });

  it('reports invalid JSON', () => {
    const result = convertJsonXml('{not json}', jsonToXml);
    expect(result.output).toBe('');
    expect(result.error).not.toBe('');
  });

  it('falls back to a default root element when the field is left blank', () => {
    const result = convertJsonXml('{"a":1,"b":2}', { ...jsonToXml, rootElement: '  ' });
    expect(result.output).toContain('<root>');
  });
});

describe('convertJsonXml xml-to-json', () => {
  it('parses XML into a JSON string, preserving the root as a key', () => {
    const result = convertJsonXml('<note><to>Bob</to></note>', xmlToJson);
    expect(result.error).toBe('');
    expect(JSON.parse(result.output)).toEqual({ note: { to: 'Bob' } });
  });

  it('parses XML attributes as @_-prefixed properties when enabled', () => {
    const result = convertJsonXml('<note id="1"><to>Bob</to></note>', xmlToJson);
    expect(JSON.parse(result.output)).toEqual({ note: { '@_id': '1', to: 'Bob' } });
  });

  it('drops XML attributes when disabled', () => {
    const result = convertJsonXml('<note id="1"><to>Bob</to></note>', { ...xmlToJson, includeAttributes: false });
    expect(JSON.parse(result.output)).toEqual({ note: { to: 'Bob' } });
  });

  it('round-trips repeated sibling elements into an array', () => {
    const result = convertJsonXml('<root><item>1</item><item>2</item></root>', xmlToJson);
    expect(JSON.parse(result.output)).toEqual({ root: { item: [1, 2] } });
  });

  it('reports malformed XML', () => {
    const result = convertJsonXml('<note><to>Bob</note>', xmlToJson);
    expect(result.output).toBe('');
    expect(result.error).not.toBe('');
  });
});

describe('convertJsonXml round-trip', () => {
  it('converts JSON to XML and back to the same JSON shape', () => {
    const original = { note: { '@_id': '1', to: 'Bob', message: 'Hello' } };
    const toXml = convertJsonXml(JSON.stringify(original), jsonToXml);
    const backToJson = convertJsonXml(toXml.output, xmlToJson);

    expect(JSON.parse(backToJson.output)).toEqual(original);
  });
});
