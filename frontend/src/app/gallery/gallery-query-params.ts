import { GalleryStatus } from '@/api/gallery';

export type SortKey =
  | 'updatedAt'
  | 'createdAt'
  | 'title'
  | 'views'
  | 'likes'
  | 'comments';
export type SortDir = 'asc' | 'desc';

export interface FilterState {
  status: Set<GalleryStatus>;
  owner: 'me' | 'any';
  range: 'any' | '7d' | '30d' | '90d';
  hasCover: boolean | null;
  hasTags: boolean | null;
  hasComments: boolean | null;
  tags: string[];
  search: string;
  favoriteBy?: 'me' | number;
}

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export const defaultSort: SortState = { key: 'updatedAt', dir: 'desc' };
export const defaultFilters: FilterState = {
  status: new Set<GalleryStatus>(),
  owner: 'any',
  range: 'any',
  hasCover: null,
  hasTags: null,
  hasComments: null,
  tags: [],
  search: '',
};

export function filtersToQuery(f: FilterState) {
  return {
    status: f.status?.size ? Array.from(f.status) : undefined,
    owner: f.owner !== 'any' ? f.owner : undefined,
    range: f.range !== 'any' ? f.range : undefined,
    // use == null to treat null OR undefined as “omit”
    hasCover: f.hasCover == null ? undefined : String(f.hasCover),
    hasTags: f.hasTags == null ? undefined : String(f.hasTags),
    hasComments: f.hasComments == null ? undefined : String(f.hasComments),
    tags: f.tags?.length ? f.tags : undefined,
    search: f.search || undefined,
    favoriteBy: f.favoriteBy == null ? undefined : String(f.favoriteBy), // if you added this
  };
}

export function sortToQuery(s: SortState) {
  return {
    sortKey: s.key,
    sortDir: s.dir,
  };
}

export function queryToFilters(q: URLSearchParams): FilterState {
  const parseTri = (k: string): boolean | null => {
    if (!q.has(k)) return null;
    const v = q.get(k);
    return v === 'true' ? true : v === 'false' ? false : null;
  };

  const status = q.get('status')?.split(',').filter(Boolean) as
    | GalleryStatus[]
    | undefined;
  const tags = q.get('tags')?.split(',').filter(Boolean) ?? [];
  const favoriteByRaw = q.get('favoriteBy') ?? undefined;
  const favoriteBy =
    favoriteByRaw === 'me'
      ? 'me'
      : favoriteByRaw != null
        ? Number.isNaN(Number(favoriteByRaw))
          ? undefined
          : Number(favoriteByRaw)
        : undefined;

  return {
    status: new Set<GalleryStatus>(status ?? []),
    owner: (q.get('owner') as 'me' | 'any') ?? 'any',
    range: (q.get('range') as FilterState['range']) ?? 'any',
    hasCover: parseTri('hasCover'),
    hasTags: parseTri('hasTags'),
    hasComments: parseTri('hasComments'),
    tags,
    search: q.get('search') ?? '',
    favoriteBy,
  };
}

export function queryToSort(q: URLSearchParams): SortState {
  const key = (q.get('sortKey') as SortKey) ?? 'updatedAt';
  const dir = (q.get('sortDir') as SortDir) ?? 'desc';
  return { key, dir };
}
