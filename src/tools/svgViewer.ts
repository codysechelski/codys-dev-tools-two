export interface SvgValidationResult {
  valid: boolean;
  error: string | null;
  width: number | null;
  height: number | null;
}

const EMPTY_RESULT: SvgValidationResult = { valid: false, error: null, width: null, height: null };

export function validateSvg(source: string): SvgValidationResult {
  const trimmed = source.trim();
  if (!trimmed) return EMPTY_RESULT;

  let doc: Document;
  try {
    doc = new DOMParser().parseFromString(trimmed, 'image/svg+xml');
  } catch {
    return { valid: false, error: 'Unable to parse this as XML.', width: null, height: null };
  }

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    return { valid: false, error: cleanParserErrorMessage(parserError.textContent), width: null, height: null };
  }

  const root = doc.documentElement;
  if (!root || root.localName.toLowerCase() !== 'svg') {
    return { valid: false, error: 'Expected the root element to be <svg>.', width: null, height: null };
  }

  return { valid: true, error: null, ...readIntrinsicSize(root) };
}

function cleanParserErrorMessage(text: string | null): string {
  if (!text) return 'This is not valid XML.';

  // Browsers embed the offending source snippet in the parsererror text; keep just the first line.
  return text.split('\n')[0].trim() || 'This is not valid XML.';
}

function readIntrinsicSize(svg: Element): { width: number | null; height: number | null } {
  const width = parsePositiveLength(svg.getAttribute('width'));
  const height = parsePositiveLength(svg.getAttribute('height'));
  if (width !== null && height !== null) return { width, height };

  const viewBox = svg.getAttribute('viewBox');
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((value) => Number.isFinite(value)) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  return { width, height };
}

function parsePositiveLength(value: string | null): number | null {
  if (!value) return null;

  const parsed = parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function buildSvgPreviewUrl(source: string): string {
  return `data:image/svg+xml,${encodeURIComponent(source)}`;
}

export function formatDimension(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');
}
