export function snakeToCamel(value: string): string {
  if (!value) return value;
  return value.replace(/[-_][a-z0-9]/g, (segment) => segment.slice(1).toUpperCase());
}

export function camelToSnake(value: string): string {
  if (!value) return value;
  return value
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
}

