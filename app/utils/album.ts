export type Album = {
  id: string;
  title: string;
  artist: string;
  date?: string;
  coverUrl?: string;
  hasCoverError?: boolean;
};

export const normalizeFirstReleaseDate = (date?: string): string | undefined => {
  if (!date) return undefined;
  const trimmedDate = date.trim();
  if (/^\d{4}$/.test(trimmedDate)) return `${trimmedDate}-01-01`;
  if (/^\d{4}-\d{2}$/.test(trimmedDate)) return `${trimmedDate}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) return trimmedDate;
  return trimmedDate || undefined;
};
