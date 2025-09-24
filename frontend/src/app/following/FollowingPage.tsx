/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import {
  defaultFilters,
  defaultSort,
} from '@/app/gallery/gallery-query-params';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Link } from 'react-router-dom';
import { useGalleries } from '@/hooks/use-gallery';
import { FollowButton } from '@/components/ui/followButton';
import { meFollowing, Person } from '@/api/follow';

type Selection = 'all' | number;

export default function FollowingPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState('');
  const [sel, setSel] = useState<Selection>('all');
  const [loadingPeople, setLoadingPeople] = useState(true);

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
    return people.filter(
      (p) =>
        (p.fullName || '').toLowerCase().includes(s) ||
        p.email.toLowerCase().includes(s)
    );
  }, [q, people]);

  // build filters for the feed
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

  // function handleUnfollow(id: number) {
  //   setPeople((prev) => prev.filter((p) => p.id !== id));
  //   if (sel === id) setSel('all');
  // }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
      {/* Left: people list */}
      <aside className="md:col-span-4 lg:col-span-3">
        <div className="sticky top-0 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">Following</h1>
            <Input
              placeholder="Filter people…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="ml-auto w-40"
            />
          </div>

          <ul className="divide-y rounded-xl border">
            <li
              className={`flex items-center justify-between p-3 cursor-pointer ${sel === 'all' ? 'bg-muted' : ''}`}
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
              <li className="p-6 text-sm text-muted-foreground text-center">
                You aren’t following anyone yet.
              </li>
            ) : (
              filtered.map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center gap-3 p-3 hover:bg-accent cursor-pointer ${sel === p.id ? 'bg-muted' : ''}`}
                  onClick={() => setSel(p.id)}
                >
                  <img
                    src={p.avatarUrl || '/avatar-fallback.png'}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {p.fullName || p.email}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {p.email}
                    </div>
                  </div>
                  {/* Stop propagation so clicking the button doesn't change selection */}
                  <div onClick={(e) => e.stopPropagation()}>
                    <FollowButton
                      userId={p.id}
                      initialIsFollowing={true}
                      // If your FollowButton accepts callbacks:
                      // onUnfollow={() => handleUnfollow(p.id)}
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

      {/* Right: feed */}
      <main className="md:col-span-8 lg:col-span-9">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-muted-foreground">
            {sel === 'all' ? 'Feed: All followed' : 'Feed: Selected author'}
            {fetching && ' · refreshing…'}
          </div>
        </div>

        {loading ? (
          <div className="p-6">Loading feed…</div>
        ) : error ? (
          <div className="p-6 text-red-500">Failed to load feed.</div>
        ) : !data || data.items?.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No galleries to show.
          </div>
        ) : (
          // Replace with your real grid/list component
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.items.map((g: any) => (
              <div key={g.id} className="rounded-xl border p-3">
                <div className="text-sm font-medium truncate">{g.title}</div>
                {/* …your existing GalleryCard here instead of this stub… */}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
