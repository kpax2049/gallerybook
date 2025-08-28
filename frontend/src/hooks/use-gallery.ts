/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { GalleriesListResponse, getGalleriesList } from '@/api/gallery';
import { SortState, FilterState } from '@/components/ui/GalleryListToolbar';
import { serializeParams } from '@/lib/apiClient';

export function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useGalleries(params: {
  sort: SortState;
  filters: FilterState;
  page: number;
  pageSize: number;
}) {
  const { sort, filters, page, pageSize } = params;
  const debouncedSearch = useDebounced(filters.search, 300);

  const [data, setData] = useState<GalleriesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // “last request wins” guard without needing AbortSignal on apiRequest
  const reqIdRef = useRef(0);

  const query = useMemo(() => {
    const status = filters.status.size ? Array.from(filters.status) : undefined;
    return serializeParams({
      status,
      owner: filters.owner !== 'any' ? filters.owner : undefined,
      range: filters.range !== 'any' ? filters.range : undefined,
      hasCover:
        filters.hasCover === null ? undefined : String(filters.hasCover),
      hasTags: filters.hasTags === null ? undefined : String(filters.hasTags),
      hasComments:
        filters.hasComments === null ? undefined : String(filters.hasComments),
      tags: filters.tags.length ? filters.tags : undefined,
      search: debouncedSearch || undefined,
      sortKey: sort.key,
      sortDir: sort.dir,
      page,
      pageSize,
      includeMyReactions: true,
    });
  }, [sort, filters, debouncedSearch, page, pageSize]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    const myReqId = ++reqIdRef.current;
    getGalleriesList(query)
      .then((res: any) => {
        if (!alive || myReqId !== reqIdRef.current) return; // stale response
        setData(res);
      })
      .catch((e: any) => {
        if (!alive || myReqId !== reqIdRef.current) return;
        setError(e);
      })
      .finally(() => {
        if (alive && myReqId == reqIdRef.current) {
          setLoading(false);
        }
      });

    return () => {
      alive = false;
    };
  }, [query]);

  return { data, loading, error };
}
