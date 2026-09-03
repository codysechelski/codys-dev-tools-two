export interface UuidGeneratorOptions {
  count: number;
  uppercase: boolean;
  removeHyphens: boolean;
}

export function generateUuids(options: UuidGeneratorOptions, uuidFactory = createUuid): string[] {
  const count = clampCount(options.count);

  return Array.from({ length: count }, () => formatUuid(uuidFactory(), options));
}

export function formatUuid(uuid: string, options: Pick<UuidGeneratorOptions, 'uppercase' | 'removeHyphens'>): string {
  const withoutHyphens = options.removeHyphens ? uuid.replaceAll('-', '') : uuid;

  return options.uppercase ? withoutHyphens.toUpperCase() : withoutHyphens.toLowerCase();
}

export function clampCount(count: number): number {
  if (!Number.isFinite(count)) return 1;
  return Math.min(Math.max(Math.trunc(count), 1), 100);
}

function createUuid(): string {
  return crypto.randomUUID();
}
