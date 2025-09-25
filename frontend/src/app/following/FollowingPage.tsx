/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import {
  defaultFilters,
  defaultSort,
} from '@/app/gallery/gallery-query-params';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { meFollowing, Person } from '@/api/follow';
import { useGalleries } from '@/hooks/use-gallery';
import { FollowButton } from '@/components/ui/followButton';
import { GalleryCard } from '../gallery/GalleryCard';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserInitials } from '@/api/user';
import { GalleryRow } from '../gallery/GalleryRow';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

type Selection = 'all' | number;
type ViewMode = 'grid' | 'list';

export default function FollowingPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Selection>('all');
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [view, setView] = useState<ViewMode>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [reactionOverrides, setReactionOverrides] = useState<
    Record<number, { like?: boolean; favorite?: boolean }>
  >({});

  function handleReactionChanged(
    id: number,
    next: { like?: boolean; favorite?: boolean }
  ) {
    setReactionOverrides((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...next },
    }));
  }
  // load followed accounts
  useEffect(() => {
    let alive = true;
    setLoadingPeople(true);
    meFollowing()
      .then((rows: Person[]) => {
        if (alive) setPeople(rows);
      })
      .finally(() => {
        if (alive) setLoadingPeople(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return people;
    return people.filter((p) => (p.fullName || '').toLowerCase().includes(s));
  }, [q, people]);

  const selectedPerson =
    sel === 'all' ? null : people.find((p) => p.id === sel) || null;
  const selectedName = selectedPerson
    ? selectedPerson.fullName || selectedPerson.email
    : null;

  // Build filters for the feed on the right
  const feedFilters = useMemo(() => {
    const base = {
      ...defaultFilters,
      owner: 'any' as const,
      favoriteBy: undefined,
    };
    if (sel === 'all') {
      return { ...base, followedOnly: true, createdById: undefined };
    }
    return { ...base, followedOnly: false, createdById: sel };
  }, [sel]);

  const { data, loading, error, fetching } = useGalleries({
    sort: defaultSort,
    filters: feedFilters,
    page: 1,
    pageSize: 24,
  });

  function handleUnfollow(id: number) {
    setPeople((prev) => prev.filter((p) => p.id !== id));
    if (sel === id) setSel('all');
  }
  const items = data?.items ?? [];

  const serverReactions: Record<number, { like: boolean; favorite: boolean }> =
    (data as any)?.myReactions ?? {};

  const commentCounts: Record<number, number> =
    (data as any)?.commentCounts ?? {};

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* LEFT: Following list (collapsible) */}
        <aside
          className={cn(
            'min-w-0',
            sidebarOpen
              ? 'block md:col-span-4 lg:col-span-3'
              : 'hidden md:hidden'
          )}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Following</h1>
              <Button
                size="icon"
                variant="ghost"
                className="ml-auto"
                onClick={() => setSidebarOpen(false)}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>

            <Input
              placeholder="Filter people…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full"
            />

            <ul className="divide-y overflow-hidden rounded-xl border">
              <li
                className={`flex cursor-pointer items-center justify-between p-3 ${sel === 'all' ? 'bg-muted' : ''}`}
                onClick={() => setSel('all')}
              >
                <div className="font-medium">All followed</div>
                <span className="text-xs text-muted-foreground">
                  {people.length}
                </span>
              </li>

              {loadingPeople ? (
                <li className="p-3 text-sm text-muted-foreground">Loading…</li>
              ) : filtered.length === 0 ? (
                <li className="p-6 text-center text-sm text-muted-foreground">
                  You aren’t following anyone yet.
                </li>
              ) : (
                filtered.map((p) => (
                  <li
                    key={p.id}
                    className={`flex cursor-pointer items-center gap-3 p-3 hover:bg-accent ${sel === p.id ? 'bg-muted' : ''}`}
                    onClick={() => setSel(p.id)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={p.avatarUrl || undefined} alt="" />
                      <AvatarFallback>{getUserInitials(p)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium">
                        {p.fullName || p.email}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.email}
                      </div>
                    </div>

                    {/* prevent button click from changing selection */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <FollowButton
                        userId={p.id}
                        iconOnly
                        onChange={(next) => {
                          if (!next) handleUnfollow(p.id);
                        }}
                      />
                    </div>
                  </li>
                ))
              )}
            </ul>

            <Button asChild variant="outline">
              <Link to="/galleries?followedOnly=true">Open full feed view</Link>
            </Button>
          </div>
        </aside>

        {/* RIGHT: Feed — expands to full width when sidebar is closed */}
        <main
          className={cn(
            'min-w-0',
            sidebarOpen ? 'md:col-span-8 lg:col-span-9' : 'md:col-span-12'
          )}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Show 'open sidebar' button only when collapsed */}
              {!sidebarOpen && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSidebarOpen(true)}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              )}
              <div className="text-sm text-muted-foreground">
                {sel === 'all' ? 'Feed: All followed' : `Feed: ${selectedName}`}
                {fetching && ' · refreshing…'}
              </div>
            </div>

            {/* Grid/List switcher */}
            <div className="inline-flex overflow-hidden rounded-lg border">
              <Button
                variant={view === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('grid')}
                className="rounded-none"
              >
                Grid
              </Button>
              <Button
                variant={view === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setView('list')}
                className="rounded-none"
              >
                List
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
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
              </div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-500">Failed to load feed.</div>
          ) : items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No galleries to show.
            </div>
          ) : view === 'grid' ? (
            <div className="rounded-2xl border bg-muted/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
                {items.map((g: any) => {
                  const base = serverReactions[g.id] ?? {
                    like: false,
                    favorite: false,
                  };
                  const current = {
                    ...base,
                    ...(reactionOverrides[g.id] ?? {}),
                  };
                  const likesDelta =
                    (current.like ? 1 : 0) - (base.like ? 1 : 0);
                  const favsDelta =
                    (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);
                  const likesDisplay = (g.likesCount ?? 0) + likesDelta;
                  const favsDisplay = (g.favoritesCount ?? 0) + favsDelta;

                  return (
                    <GalleryCard
                      key={g.id}
                      to={`/galleries/${g.slug ?? g.id}`}
                      item={g}
                      comments={commentCounts[g.id] ?? 0}
                      myReaction={current}
                      likesCountOverride={likesDisplay}
                      favoritesCountOverride={favsDisplay}
                      onReactionChanged={(next) =>
                        handleReactionChanged(g.id, next)
                      }
                    />
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border bg-card">
              <ul className="divide-y">
                {items.map((g: any) => {
                  const base = serverReactions[g.id] ?? {
                    like: false,
                    favorite: false,
                  };
                  const current = {
                    ...base,
                    ...(reactionOverrides[g.id] ?? {}),
                  };
                  const likesDelta =
                    (current.like ? 1 : 0) - (base.like ? 1 : 0);
                  const favsDelta =
                    (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);
                  const likesDisplay = (g.likesCount ?? 0) + likesDelta;
                  const favsDisplay = (g.favoritesCount ?? 0) + favsDelta;

                  return (
                    <GalleryRow
                      key={g.id}
                      item={g}
                      comments={commentCounts[g.id] ?? 0}
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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
