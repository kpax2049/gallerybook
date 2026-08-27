import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FolderOpen, ImageIcon } from 'lucide-react';
import { getPublicFolder, PublicFolderResponse } from '@/api/folder';
import { Gallery } from '@/api/gallery';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function PublicFolderPage() {
  const { username = '', folderSlug = '' } = useParams<{
    username: string;
    folderSlug: string;
  }>();
const [data, setData] = React.useState<PublicFolderResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [loadMoreError, setLoadMoreError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadFolder() {
      try {
        setLoading(true);
        setData(null);
        setError(null);
        setLoadMoreError(null);
        const response = await getPublicFolder(username, folderSlug, {
          page: 1,
          pageSize: 24,
        });
        if (!cancelled) setData(response);
      } catch {
        if (!cancelled) {
          setData(null);
          setError('Folder not found');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (username && folderSlug) void loadFolder();

    return () => {
      cancelled = true;
    };
  }, [folderSlug, username]);

  const folder = data?.folder;
  const ownerName = folder?.owner.displayName || folder?.owner.username || '';
  const hasMore = data ? data.galleries.length < data.total : false;

  const loadMore = async () => {
    if (!data || loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      setLoadMoreError(null);
      const next = await getPublicFolder(username, folderSlug, {
        page: data.page + 1,
        pageSize: data.pageSize,
      });
      setData((current) => {
        if (!current) return next;
        return {
          ...next,
          galleries: [...current.galleries, ...next.galleries],
          commentCounts: { ...current.commentCounts, ...next.commentCounts },
        };
      });
    } catch {
      setLoadMoreError('Unable to load more galleries. Please try again.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <main className="gb-page min-h-screen px-4 py-6 text-[var(--gb-ink)] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="gb-chip rounded-[11px]">
            <Link to="/galleries">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Galleries
            </Link>
          </Button>
          <div className="inline-flex items-center gap-2 text-sm text-[var(--gb-ink-mute)]">
            <FolderOpen className="h-4 w-4" />
            Public folder
          </div>
        </div>

        {loading ? (
          <div className="gb-panel rounded-[14px] p-8 text-sm text-[var(--gb-ink-mute)]">
            Loading folder...
          </div>
        ) : error || !folder ? (
          <div className="gb-panel rounded-[14px] p-8">
            <h1 className="gb-serif text-[34px] font-medium">
              Folder not found
            </h1>
            <p className="mt-2 text-sm text-[var(--gb-ink-mute)]">
              This folder is unavailable or no longer shared.
            </p>
          </div>
        ) : (
          <>
            <section className="gb-panel overflow-hidden rounded-[14px] border border-[var(--gb-border)]">
              {folder.coverGallery?.thumbnail ? (
                <div
                  className="h-52 bg-cover bg-center sm:h-64"
                  style={{
                    backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.12),rgba(0,0,0,.58)),url(${folder.coverGallery.thumbnail})`,
                  }}
                />
              ) : (
                <div className="flex h-52 items-center justify-center bg-[var(--gb-surface-2)] sm:h-64">
                  <ImageIcon className="h-10 w-10 text-[var(--gb-ink-mute)]" />
                </div>
              )}
              <div className="p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="gb-serif text-[42px] font-medium leading-none sm:text-[58px]">
                      {folder.name}
                    </h1>
                    {folder.description && (
                      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--gb-ink-soft)]">
                        {folder.description}
                      </p>
                    )}
                  </div>
                  <div className="inline-flex items-center gap-3 rounded-[12px] border border-[var(--gb-border)] bg-[var(--gb-surface)] px-3 py-2">
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src={folder.owner.avatarUrl ?? undefined}
                        alt={ownerName}
                      />
                      <AvatarFallback>{getInitials(ownerName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">{ownerName}</div>
                      <div className="text-xs text-[var(--gb-ink-mute)]">
                        {folder.galleriesCount} public galleries
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.galleries.map((gallery) => (
                <PublicGalleryCard
                  key={gallery.id}
                  gallery={gallery}
                  comments={data.commentCounts[gallery.id] ?? 0}
                />
              ))}
            </section>

            {hasMore && (
              <div className="mt-8 text-center">
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    className="gb-chip rounded-[11px]"
                    disabled={loadingMore}
                    onClick={() => void loadMore()}
                  >
                    {loadingMore ? 'Loading…' : 'Load more galleries'}
                  </Button>
                </div>
                {loadMoreError && (
                  <p className="mt-2 text-sm text-destructive">
                    {loadMoreError}
                  </p>
                )}
              </div>
            )}

            {data.galleries.length === 0 && (
              <div className="gb-panel mt-8 rounded-[14px] p-8 text-sm text-[var(--gb-ink-mute)]">
                No public galleries are available in this folder.
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return 'GB';
  return trimmed
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function PublicGalleryCard({
  gallery,
  comments,
}: {
  gallery: Gallery;
  comments: number;
}) {
  const target = `/shared/galleries/${gallery.slug ?? gallery.id}`;

  return (
    <Link
      to={target}
      className="gb-paper gb-print-card block rounded-[7px] p-[11px] pb-3 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
    >
      <div className="relative h-44 overflow-hidden rounded-sm bg-[var(--gb-surface)]">
        {gallery.thumbnail ? (
          <img
            src={gallery.thumbnail}
            alt={gallery.title ?? 'Gallery cover'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--gb-ink-mute)]">
            No cover
          </div>
        )}
      </div>
      <div className="mt-3 px-1">
        <h2 className="gb-hand truncate text-[24px] font-semibold leading-none text-[var(--gb-hand)]">
          {gallery.title ?? 'Untitled gallery'}
        </h2>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--gb-ink-mute)]">
          <span>{gallery.viewsCount ?? 0} views</span>
          <span>{gallery.likesCount ?? 0} likes</span>
          <span>{comments} comments</span>
        </div>
      </div>
    </Link>
  );
}
