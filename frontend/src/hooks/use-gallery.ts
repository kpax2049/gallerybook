/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from 'react';
import { GalleriesListResponse, getGalleriesList } from '@/api/gallery';
import { serializeParams } from '@/lib/apiClient';
import { FilterState, SortState } from '@/app/gallery/gallery-query-params';

export function useGalleries(params: {
  sort: SortState;
  filters?: FilterState;
  page: number;
  pageSize: number;
}) {
  const { sort, filters, page, pageSize } = params;

  const [data, setData] = useState<GalleriesListResponse | null>(null);
  const [loading, setLoading] = useState(true); // first load only
  const [fetching, setFetching] = useState(false); // subsequent refetches
  const [error, setError] = useState<Error | null>(null);

  const reqIdRef = useRef(0);

  const statusList = useMemo(
    () => (filters?.status?.size ? Array.from(filters.status) : undefined),
    [filters?.status]
  );

  const tagsList = useMemo(
    () => (filters?.tags?.length ? filters.tags : undefined),
    [filters?.tags]
  );

  const followedOnly = !!filters?.followedOnly;
  const ownerParam =
    !followedOnly && filters?.owner !== 'any' ? filters?.owner : undefined;
  const favoriteByParam =
    !followedOnly && filters?.favoriteBy !== undefined
      ? String(filters?.favoriteBy)
      : undefined;
  const likedByParam =
    !followedOnly && filters?.likedBy !== undefined
      ? String(filters?.likedBy)
      : undefined;

  const query = useMemo(() => {
    return serializeParams({
      status: statusList,
      owner: ownerParam,
      range: filters?.range !== 'any' ? filters?.range : undefined,
      hasCover:
        filters?.hasCover === null ? undefined : String(filters?.hasCover),
      hasTags: filters?.hasTags === null ? undefined : String(filters?.hasTags),
      hasComments:
        filters?.hasComments === null
          ? undefined
          : String(filters?.hasComments),
      tags: tagsList,
      favoriteBy: favoriteByParam,
      likedBy: likedByParam,
      search: filters?.search || undefined,
      sortKey: sort.key,
      sortDir: sort.dir,
      page,
      pageSize,
      includeMyReactions: true,
      followedOnly: followedOnly ? 'true' : undefined,
    });
  }, [
    sort.key,
    sort.dir,
    page,
    pageSize,
    // deps used above:
    ownerParam,
    favoriteByParam,
    likedByParam,
    filters?.range,
    filters?.hasCover,
    filters?.hasTags,
    filters?.hasComments,
    filters?.search,
    statusList?.join(','), // stable dep when arrays change
    tagsList?.join(','),
    followedOnly,
  ]);

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    const isFirstLoad = data == null;
    if (isFirstLoad) {
      setLoading(true);
      setError(null);
    } else {
      setFetching(true);
    }

    getGalleriesList(query)
      .then((res: any) => {
        if (!alive || myReqId !== reqIdRef.current) return;
        setData(res);
        setError(null);
      })
      .catch((e: any) => {
        if (!alive || myReqId !== reqIdRef.current) return;
        setError(e);
      })
      .finally(() => {
        if (!alive || myReqId !== reqIdRef.current) return;
        if (isFirstLoad) setLoading(false);
        setFetching(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return { data, loading, error, fetching };
}
