type JsonLike =
  | null
  | boolean
  | number
  | string
  | JsonLike[]
  | { [key: string]: JsonLike };

function isPlainObject(value: unknown): value is Record<string, JsonLike> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function toSnakeCase(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

function convertKeys(value: JsonLike, keyMapper: (key: string) => string): JsonLike {
  if (Array.isArray(value)) {
    return value.map((item) => convertKeys(item, keyMapper));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce<Record<string, JsonLike>>((accumulator, [key, nestedValue]) => {
    accumulator[keyMapper(key)] = convertKeys(nestedValue, keyMapper);
    return accumulator;
  }, {});
}

export function normalizeResponseCase<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  return convertKeys(value as JsonLike, toSnakeCase) as T;
}

export function convertRequestCase<T>(value: T, mode: 'snake' | 'camel'): T {
  if (value === null || value === undefined) {
    return value;
  }

  if (mode === 'snake') {
    return value;
  }

  return convertKeys(value as JsonLike, toCamelCase) as T;
}
