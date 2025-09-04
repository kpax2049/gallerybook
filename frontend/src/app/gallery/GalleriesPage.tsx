import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GalleryListToolbar } from '@/components/ui/galleryListToolbar';
import { useGalleries } from '@/hooks/use-gallery';
import { useGalleryListState } from '@/stores/galleryStore';
import {
  queryToSort,
  queryToFilters,
  filtersToQuery,
  sortToQuery,
  SortState,
  FilterState,
} from './gallery-query-params';
import { GalleryCard } from './GalleryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { GalleryRow } from './GalleryRow';
import { Gallery } from '@/api/gallery';

type ReactionPatch = { like?: boolean; favorite?: boolean };
type ViewMode = 'grid' | 'list';

export default function GalleriesPage() {
  const [sp, setSp] = useSearchParams();
  const [view, setView] = React.useState<ViewMode>(() =>
    sp.get('view') === 'list' ? 'list' : 'grid'
  );
  const { sort, setSort, filters, setFilters, pager, setPager } =
    useGalleryListState();

  // Optimistic overlays
  const [reactionOverrides, setReactionOverrides] = React.useState<
    Record<number, { like: boolean; favorite: boolean }>
  >({});

  // Hydrate from URL once at mount
  React.useEffect(() => {
    const hydratedSort = queryToSort(sp);
    const hydratedFilters = queryToFilters(sp);
    setSort(hydratedSort);
    setFilters(hydratedFilters);
    const page = Number(sp.get('page') ?? 1);
    const pageSize = Number(sp.get('pageSize') ?? 24);
    setPager({ page, pageSize });
    if (sp.get('view') === 'list') setView('list');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync with state
  React.useEffect(() => {
    const next = new URLSearchParams(sp);
    const fq = filtersToQuery(filters);
    const sq = sortToQuery(sort);
    Object.entries({
      ...fq,
      ...sq,
      page: pager.page,
      pageSize: pager.pageSize,
    }).forEach(([k, v]) => {
      if (
        v === undefined ||
        v === null ||
        v === '' ||
        (Array.isArray(v) && v.length === 0)
      ) {
        next.delete(k);
      } else if (Array.isArray(v)) {
        next.set(k, v.join(','));
      } else {
        next.set(k, String(v));
      }
    });
    if (view === 'list') next.set('view', 'list');
    else next.delete('view');
    setSp(next, { replace: true });
  }, [filters, sort, pager, view, setSp, sp]);

  // Fetch galleries
  const { data, loading, error } = useGalleries({
    sort,
    filters,
    page: pager.page,
    pageSize: pager.pageSize,
  });

  const items = data?.items ?? [];
  const commentCounts = data?.commentCounts ?? {};
  const serverReactions = data?.myReactions ?? {};

  // Stable callbacks
  const handleReactionChanged = React.useCallback(
    (id: number, next: ReactionPatch) => {
      setReactionOverrides((prev) => {
        const base = serverReactions[id] ?? { like: false, favorite: false };
        const curr = prev[id] ?? base;
        return {
          ...prev,
          [id]: {
            like: next.like ?? curr.like,
            favorite: next.favorite ?? curr.favorite,
          },
        };
      });
    },
    [serverReactions]
  );

  const renderGridCard = (g: Gallery) => {
    const base = serverReactions[g.id] ?? { like: false, favorite: false };
    const current = reactionOverrides[g.id] ?? base;
    const likesDelta = (current.like ? 1 : 0) - (base.like ? 1 : 0);
    const favsDelta = (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);
    const likesDisplay = (g.likesCount ?? 0) + likesDelta;
    const favsDisplay = (g.favoritesCount ?? 0) + favsDelta;
    const effectiveItem = { ...g }; // tags show only; no editing here

    return (
      <GalleryCard
        key={g.id}
        item={effectiveItem}
        comments={commentCounts[g.id] ?? 0}
        myReaction={current}
        likesCountOverride={likesDisplay}
        favoritesCountOverride={favsDisplay}
        onReactionChanged={(next) => handleReactionChanged(g.id, next)}
        // no tag editing in card
      />
    );
  };

  function ListSkeleton() {
    return (
      <ul className="divide-y">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 p-3">
            <div className="h-16 w-24 rounded-md bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 bg-muted rounded" />
              <div className="h-3 w-1/4 bg-muted rounded" />
            </div>
            <div className="h-8 w-24 bg-muted rounded" />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4 p-2">
      <GalleryListToolbar
        sort={sort}
        filters={filters}
        onSortChange={(s: SortState) => setSort(s)}
        onFiltersChange={(f: FilterState) => setFilters(f)}
        availableTags={[]} // (optional) wire suggestions later
        resultCount={data?.total}
        view={view}
        onViewChange={(v: ViewMode) => setView(v)}
      />

      {error && !loading && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {error.message}
        </div>
      )}
      {view === 'grid' ? (
        <div className="rounded-2xl border bg-muted/30 p-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
            {loading &&
              Array.from({ length: 6 }).map((_, i) => (
                <figure
                  key={i}
                  className="rounded-[14px] bg-white p-3 pb-12 shadow-sm ring-1 ring-black/5"
                >
                  <div className="rounded-[10px] overflow-hidden">
                    <Skeleton className="aspect-[4/3] w-full" />
                  </div>
                  <div className="mt-2 px-2 space-y-2">
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex gap-3">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                </figure>
              ))}

            {!loading && items.map(renderGridCard)}
          </div>
        </div>
      ) : (
        // NEW: list surface
        <div className="rounded-2xl border bg-card">
          {loading ? (
            <ListSkeleton />
          ) : (
            <ul className="divide-y">
              {items.map((g) => {
                // reactions math (same as before)
                const base = serverReactions[g.id] ?? {
                  like: false,
                  favorite: false,
                };
                const current = reactionOverrides[g.id] ?? base;
                const likesDelta = (current.like ? 1 : 0) - (base.like ? 1 : 0);
                const favsDelta =
                  (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);
                const likesDisplay = (g.likesCount ?? 0) + likesDelta;
                const favsDisplay = (g.favoritesCount ?? 0) + favsDelta;

                return (
                  <GalleryRow
                    key={g.id}
                    item={g}
                    comments={data?.commentCounts?.[g.id] ?? 0}
                    myReaction={current}
                    likesCountOverride={likesDisplay}
                    favoritesCountOverride={favsDisplay}
                    onReactionChanged={(next) =>
                      handleReactionChanged(g.id, next)
                    }
                  />
                );
              })}
            </ul>
          )}
        </div>
      )}
      {!loading && items.length === 0 && !error && (
        <div className="mt-14 flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-muted-foreground">No galleries yet.</p>
          <Link to="/galleries/new">
            <Button size="sm" variant="secondary">
              Create your first gallery
            </Button>
          </Link>
        </div>
      )}

      {data && data.total > pager.pageSize && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            disabled={pager.page <= 1}
            onClick={() => setPager({ ...pager, page: pager.page - 1 })}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {pager.page} of {Math.ceil(data.total / pager.pageSize)}
          </div>
          <Button
            variant="outline"
            disabled={pager.page >= Math.ceil(data.total / pager.pageSize)}
            onClick={() => setPager({ ...pager, page: pager.page + 1 })}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
