export function createPageUrl(page: string): string {
  return `/${page.toLowerCase().replace(/\s+/g, '-')}`;
}
