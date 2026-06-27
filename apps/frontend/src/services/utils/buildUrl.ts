/**
 * Builds a URL with a query string from a params object.
 * Automatically strips null, undefined, and empty-string values.
 *
 * @example
 * buildUrl('/users', { page: 1, search: 'joão', active: true })
 * // → '/users?page=1&search=jo%C3%A3o&active=true'
 */
export function buildUrl(path: string, params: Record<string, unknown> = {}): string {
  const filteredEntries = Object.entries(params).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  ) as Array<[string, string | number | boolean]>;

  if (filteredEntries.length === 0) return path;

  const query = new URLSearchParams(
    filteredEntries.map(([key, value]) => [key, String(value)])
  ).toString();

  return `${path}?${query}`;
}
