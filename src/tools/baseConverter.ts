const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz';

export function digitValue(character: string): number | null {
  const index = DIGITS.indexOf(character.toLowerCase());
  return index === -1 ? null : index;
}

export function isValidBase(base: number): boolean {
  return Number.isInteger(base) && base >= 2 && base <= 36;
}

export function parseInBase(input: string, base: number): bigint | null {
  if (!isValidBase(base)) return null;

  const trimmed = input.trim();
  if (!trimmed) return null;

  const negative = trimmed.startsWith('-');
  const digits = negative || trimmed.startsWith('+') ? trimmed.slice(1) : trimmed;
  if (!digits.length) return null;

  let result = 0n;
  const bigBase = BigInt(base);

  for (const character of digits) {
    const value = digitValue(character);
    if (value === null || value >= base) return null;

    result = result * bigBase + BigInt(value);
  }

  return negative ? -result : result;
}

export function formatInBase(value: bigint, base: number): string {
  if (!isValidBase(base)) return '';

  return value.toString(base);
}
