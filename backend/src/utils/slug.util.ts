export function slugify(input: string): string {
  return (
    input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip accents
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-') // non-alnum
      .replace(/^-+|-+$/g, '') || // trim
    'untitled'
  );
}
