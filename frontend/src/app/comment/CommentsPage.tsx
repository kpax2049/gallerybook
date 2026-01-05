import * as React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';
import { CommentItem, CommentScope } from '@/api/comment';
import { useComments } from '@/hooks/use-comments';

const SCOPES: { key: CommentScope; label: string }[] = [
  { key: 'onMyGalleries', label: 'On my galleries' },
  { key: 'authored', label: 'Authored by me' },
  { key: 'mentions', label: 'Mentions' },
];

const getAuthorInitials = (name?: string | null) => {
  if (!name) return 'GB';
  const letters = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return letters || 'GB';
};

export default function CommentsPage() {
  const [sp, setSp] = useSearchParams();
  const scopeFromUrl = (sp.get('scope') as CommentScope) || 'onMyGalleries';

  const [scope, setScope] = React.useState<CommentScope>(scopeFromUrl);
  const [search, setSearch] = React.useState(sp.get('search') ?? '');
  const [page, setPage] = React.useState(Number(sp.get('page') ?? 1));
  const [pageSize] = React.useState(Number(sp.get('pageSize') ?? 24));

  React.useEffect(() => {
    sessionStorage.setItem(
      'lastGalleryHub',
      JSON.stringify({ hub: 'comments', search: location.search })
    );
  }, [location.search]);

  // keep URL in sync
  React.useEffect(() => {
    const next = new URLSearchParams(sp);
    next.set('scope', scope);
    if (search) next.set('search', search);
    else next.delete('search');
    next.set('page', String(page));
    next.set('pageSize', String(pageSize));
    setSp(next, { replace: true });
  }, [scope, search, page, pageSize, setSp, sp]);

  const { data, loading, fetching, error } = useComments({
    scope,
    page,
    pageSize,
    search,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-4 p-2">
      {/* Minimal toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search (first, left) */}
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search comments…"
          className="h-8 w-[260px] sm:w-[320px] max-w-full"
        />

        <div className="flex items-center gap-1">
          {SCOPES.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className={cn(
                'h-8 px-2 rounded-md',
                scope === key &&
                  'bg-muted text-foreground border-border shadow-sm'
              )}
              onClick={() => {
                setScope(key);
                setPage(1);
              }}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Results badge */}
        <Badge
          variant="secondary"
          className="h-6 rounded-md px-2 tabular-nums font-medium inline-flex items-center gap-1"
          aria-label={`${total.toLocaleString()} results`}
          title={`${total.toLocaleString()} results`}
        >
          {total.toLocaleString()}
          <span className="hidden sm:inline">results</span>
        </Badge>
      </div>

      {/* Content */}
      <div className="rounded-2xl border bg-card">
        {loading ? (
          <ListSkeleton />
        ) : error ? (
          <div className="p-4 text-sm text-destructive">
            {error.message || 'Failed to load comments.'}
          </div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted-foreground">
            No comments found.
          </div>
        ) : (
          <ul className="divide-y">
            {items.map((c) => (
              <CommentRow key={c.id} c={c} fetching={fetching} />
            ))}
          </ul>
        )}
      </div>

      {/* Pager */}
      {data && total > pageSize && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Button
            variant="outline"
            disabled={page <= 1 || fetching}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </Button>
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / pageSize)}
          </div>
          <Button
            variant="outline"
            disabled={page >= Math.ceil(total / pageSize) || fetching}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

function CommentRow({ c, fetching }: { c: CommentItem; fetching: boolean }) {
  const avatarSrc =
    c.author.avatarUrl ?? c.author.avatar ?? c.author.profile?.avatarUrl ?? '';

  return (
    <li
      className={cn(
        'p-3 hover:bg-muted/30 transition',
        fetching && 'opacity-70'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Avatar className="h-8 w-8 ring-1 ring-border/60 overflow-hidden">
          <AvatarImage src={avatarSrc || undefined} alt={c.author.name} />
          <AvatarFallback className="bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white text-xs font-medium uppercase">
            {getAuthorInitials(c.author.name)}
          </AvatarFallback>
        </Avatar>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="text-sm leading-tight">
            <span className="font-medium">{c.author.name}</span>
            <span className="text-muted-foreground">
              {' '}
              • {new Date(c.createdAt).toLocaleString()}
            </span>
          </div>

          <div className="mt-1 text-sm line-clamp-3">{c.body}</div>

          <div className="mt-2 text-xs text-muted-foreground">
            on{' '}
            <Link to={`/galleries/${c.gallery.id}`} className="underline">
              {c.gallery.title || 'Untitled gallery'}
            </Link>
          </div>
        </div>

        {/* Thumbnail */}
        <Link to={`/galleries/${c.gallery.id}`} className="shrink-0">
          <div className="relative">
            <img
              src={c.gallery.thumbnail || ''}
              alt={c.gallery.title || 'cover'}
              className={cn(
                'h-14 w-20 rounded object-cover bg-muted',
                !c.gallery.thumbnail && 'opacity-60'
              )}
            />
            <span className="absolute -bottom-1 -right-1 inline-flex h-5 items-center rounded bg-primary px-1.5 text-[10px] text-primary-foreground shadow">
              <MessageSquare className="mr-1 h-3 w-3" />
              Open
            </span>
          </div>
        </Link>
      </div>
    </li>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3 p-3">
          {/* avatar */}
          <Skeleton className="h-8 w-8 rounded-full" />

          {/* text */}
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-5/6" />
            <Skeleton className="h-3 w-1/2" />
          </div>

          {/* thumbnail */}
          <Skeleton className="h-14 w-20 rounded" />
        </li>
      ))}
    </ul>
  );
}
