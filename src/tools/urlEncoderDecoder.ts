export type UrlTransformMode = 'encode' | 'decode';

export interface UrlTransformOptions {
  mode: UrlTransformMode;
  component: boolean;
  formSpaces: boolean;
  rfc3986: boolean;
}

export interface UrlTransformResult {
  output: string;
  error: string;
}

export function transformUrl(input: string, options: UrlTransformOptions): UrlTransformResult {
  try {
    return {
      output: options.mode === 'encode' ? encodeUrl(input, options) : decodeUrl(input, options),
      error: '',
    };
  } catch (error) {
    return {
      output: '',
      error: error instanceof Error ? error.message : 'Unable to transform URL text',
    };
  }
}

export function encodeUrl(input: string, options: Pick<UrlTransformOptions, 'component' | 'formSpaces' | 'rfc3986'>): string {
  let output = options.component ? encodeURIComponent(input) : encodeURI(input);

  if (options.rfc3986) {
    output = output.replace(/%5B/g, '[').replace(/%5D/g, ']').replace(/[!'()*]/g, encodeStrictCharacter);
  }

  if (options.formSpaces) {
    output = output.replace(/%20/g, '+');
  }

  return output;
}

export function decodeUrl(input: string, options: Pick<UrlTransformOptions, 'component' | 'formSpaces'>): string {
  const value = options.formSpaces ? input.replace(/\+/g, ' ') : input;

  return options.component ? decodeURIComponent(value) : decodeURI(value);
}

function encodeStrictCharacter(character: string): string {
  return `%${character.codePointAt(0)?.toString(16).toUpperCase()}`;
}
