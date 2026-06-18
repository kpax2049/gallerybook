import * as React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MessageSquare, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { CommentItem, CommentScope } from '@/api/comment';
import { useComments } from '@/hooks/use-comments';
import { DeskHeader } from '@/app/gallery/GalleriesPage';

const SCOPES: { key: CommentScope; label: string }[] = [
  { key: 'onMyGalleries', label: 'On my galleries' },
  { key: 'authored', label: 'Authored by me' },
  { key: 'mentions', label: 'Mentions' },
];

const getAuthorInitials = (name?: string | null) => {
  if (!name) return 'GB';
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'GB'
  );
};

export default function CommentsPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const scopeFromUrl = (sp.get('scope') as CommentScope) || 'onMyGalleries';
  const [scope, setScope] = React.useState<CommentScope>(scopeFromUrl);
  const [search, setSearch] = React.useState(sp.get('search') ?? '');
  const [page, setPage] = React.useState(Number(sp.get('page') ?? 1));
  const [pageSize] = React.useState(Number(sp.get('pageSize') ?? 24));
  const currentSearch = sp.toString();

  React.useEffect(() => {
    const searchValue = currentSearch ? `?${currentSearch}` : '';
    sessionStorage.setItem(
      'lastGalleryHub',
      JSON.stringify({ hub: 'comments', search: searchValue })
    );
  }, [currentSearch]);

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
    <div className="gb-page">
      <DeskHeader onCreate={() => navigate('/galleries/new')} />
      <main className="gb-shell px-0 pb-[70px] pt-8 sm:px-3">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="gb-serif text-[33px] font-medium leading-none tracking-normal">
              Comments
            </h1>
            <p className="gb-hand mt-1 text-[22px] font-semibold text-[var(--gb-hand)]">
              {total.toLocaleString()} comments
            </p>
          </div>

          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gb-ink-mute)]" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search comments..."
              className="gb-field h-10 w-[min(78vw,320px)] rounded-[11px] pl-9 shadow-none focus-visible:ring-[var(--gb-accent)]"
              aria-label="Search comments"
            />
          </label>
        </section>

        <nav className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {SCOPES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              data-active={scope === key}
              className="gb-chip h-10 shrink-0 rounded-full px-4 text-sm font-medium"
              onClick={() => {
                setScope(key);
                setPage(1);
              }}
            >
              {label}
            </button>
          ))}
          <Link
            to="/galleries"
            className="gb-chip inline-flex h-10 shrink-0 items-center rounded-full px-4 text-sm font-medium"
          >
            Back to galleries
          </Link>
        </nav>

        <section className={cn('mt-8 space-y-5', fetching && 'opacity-80')}>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => <CommentSkeleton key={index} />)
          ) : error ? (
            <div className="rounded-[14px] border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error.message || 'Failed to load comments.'}
            </div>
          ) : items.length === 0 ? (
            <div className="gb-paper mx-auto max-w-md p-8 text-center">
              <p className="gb-hand text-2xl text-[var(--gb-hand)]">No comments found.</p>
            </div>
          ) : (
            items.map((comment, index) => (
              <CommentNote key={comment.id} comment={comment} index={index} />
            ))
          )}
        </section>

        {data && total > pageSize && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Button
              variant="outline"
              className="gb-chip rounded-[11px]"
              disabled={page <= 1 || fetching}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Prev
            </Button>
            <div className="text-sm text-[var(--gb-ink-soft)]">
              Page {page} of {Math.ceil(total / pageSize)}
            </div>
            <Button
              variant="outline"
              className="gb-chip rounded-[11px]"
              disabled={page >= Math.ceil(total / pageSize) || fetching}
              onClick={() => setPage((value) => value + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

function CommentNote({
  comment,
  index,
}: {
  comment: CommentItem;
  index: number;
}) {
  const avatarSrc =
    comment.author.avatarUrl ??
    comment.author.avatar ??
    comment.author.profile?.avatarUrl ??
    '';

  return (
    <article
      className="gb-paper animate-[gb-card-enter_520ms_cubic-bezier(.2,.85,.3,1)_backwards] p-4 sm:p-5"
      style={
        {
          '--gb-tilt': index % 2 === 0 ? '-.5deg' : '.45deg',
          '--gb-delay': `${index * 45}ms`,
        } as React.CSSProperties
      }
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar className="h-11 w-11 ring-1 ring-[var(--gb-border)]">
          <AvatarImage src={avatarSrc || undefined} alt={comment.author.name} />
          <AvatarFallback className="text-xs">
            {getAuthorInitials(comment.author.name)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="gb-serif text-[18px] font-medium leading-tight">
            {comment.author.name}
            <span className="ml-2 font-sans text-[11.5px] text-[var(--gb-ink-mute)]">
              {new Date(comment.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="gb-hand mt-2 line-clamp-4 text-[23px] font-semibold leading-7 text-[var(--gb-paper-ink)]">
            {comment.body}
          </p>
          <div className="mt-3 text-xs text-[var(--gb-ink-mute)]">
            on{' '}
            <Link to={`/galleries/${comment.gallery.id}`} className="underline underline-offset-4">
              {comment.gallery.title || 'Untitled gallery'}
            </Link>
          </div>
        </div>

        <Link to={`/galleries/${comment.gallery.id}`} className="group relative block h-24 w-full shrink-0 overflow-hidden rounded bg-[var(--gb-surface)] sm:w-36">
          {comment.gallery.thumbnail ? (
            <img
              src={comment.gallery.thumbnail}
              alt={comment.gallery.title || 'cover'}
              className="h-full w-full object-cover transition group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--gb-ink-mute)]">
              No cover
            </div>
          )}
          <span className="absolute bottom-2 right-2 inline-flex h-7 items-center rounded bg-[var(--gb-accent)] px-2 text-xs font-medium text-[var(--gb-accent-ink)] shadow">
            <MessageSquare className="mr-1 h-3.5 w-3.5" />
            Open
          </span>
        </Link>
      </div>
    </article>
  );
}

function CommentSkeleton() {
  return (
    <div className="gb-paper p-5">
      <div className="flex gap-4">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="hidden h-24 w-36 rounded sm:block" />
      </div>
    </div>
  );
}
