/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CommentScope,
  CommentsListResponse,
  getCommentsList,
} from '@/api/comment';
import { useEffect, useMemo, useRef, useState } from 'react';

function useDebounced<T>(value: T, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export function useComments(params: {
  scope: CommentScope;
  page: number;
  pageSize: number;
  search?: string;
}) {
  const { scope, page, pageSize, search } = params;
  const debouncedSearch = useDebounced(search ?? '', 300);

  const [data, setData] = useState<CommentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const reqIdRef = useRef(0);

  const q = useMemo(
    () => ({ scope, page, pageSize, search: debouncedSearch || undefined }),
    [scope, page, pageSize, debouncedSearch]
  );

  useEffect(() => {
    let alive = true;
    const myReqId = ++reqIdRef.current;

    const isFirst = data == null;
    if (isFirst) {
      setLoading(true);
      setError(null);
    } else {
      setFetching(true);
    }

    getCommentsList(q)
      .then((res) => {
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
        if (isFirst) setLoading(false);
        setFetching(false);
      });

    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return { data, loading, fetching, error };
}
