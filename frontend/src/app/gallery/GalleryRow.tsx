import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { deleteGallery, Gallery, toggleReaction } from '@/api/gallery';
import { useUserStore } from '@/stores/userStore';
import { isAdmin } from '@/lib/authz';

type RowProps = {
  item: Gallery;
  comments: number;
  myReaction?: { like: boolean; favorite: boolean };
  onReactionChanged?: (next: { like?: boolean; favorite?: boolean }) => void;
  likesCountOverride?: number;
  favoritesCountOverride?: number;
  onDeleted?: (id: number) => void;
  onEditRequested?: () => void;
  style?: React.CSSProperties;
};

export function GalleryRow({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
  onDeleted,
  onEditRequested,
  style,
}: RowProps) {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const canManage = isAdmin(currentUser);
  const [busyLike, setBusyLike] = React.useState(false);
  const [busyFav, setBusyFav] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const liked = !!myReaction?.like;
  const faved = !!myReaction?.favorite;
  const likesDisplay = likesCountOverride ?? item.likesCount ?? 0;
  const favsDisplay = favoritesCountOverride ?? item.favoritesCount ?? 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const onToggle = async (type: 'LIKE' | 'FAVORITE') => {
    const isLike = type === 'LIKE';
    const setBusy = isLike ? setBusyLike : setBusyFav;
    setBusy(true);
    try {
      const res = await toggleReaction(item.id, type);
      const prev = isLike ? liked : faved;
      const active = typeof res?.active === 'boolean' ? res.active : !prev;
      onReactionChanged?.(isLike ? { like: active } : { favorite: active });
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteGallery(item.id);
      onDeleted?.(item.id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const onEdit = () => {
    if (onEditRequested) onEditRequested();
    else navigate(`/galleries/edit/${item.id}`);
  };

  return (
    <article
      className="animate-[gb-card-enter_520ms_cubic-bezier(.2,.85,.3,1)_backwards] rounded-[14px] border border-[var(--gb-border)] bg-[var(--gb-surface-2)] p-3 text-[var(--gb-ink)] shadow-[0_18px_40px_-32px_rgba(0,0,0,.55)] transition hover:-translate-y-1 hover:border-[var(--gb-border-2)]"
      style={style}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          to={`/galleries/${item.slug ?? item.id}`}
          className="block h-[74px] w-full shrink-0 overflow-hidden rounded bg-[var(--gb-surface)] sm:w-[116px]"
        >
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title ?? 'cover'}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--gb-ink-mute)]">
              No cover
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/galleries/${item.slug ?? item.id}`}>
            <h2 className="gb-serif truncate text-lg font-medium">
              {item.title ?? 'Untitled gallery'}
            </h2>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--gb-ink-soft)]">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" /> {likesDisplay}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> {favsDisplay}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" /> {comments}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="max-w-32 truncate rounded-full bg-[var(--gb-accent-soft)] px-2 py-0.5 text-[11px] text-[var(--gb-ink-soft)]"
              >
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="rounded-full border border-[var(--gb-border)] px-2 py-0.5 text-[11px] text-[var(--gb-ink-soft)]">
                +{tags.length - 4}
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="gb-chip h-9 w-9 rounded-full"
            aria-pressed={liked}
            onClick={() => onToggle('LIKE')}
            title={liked ? 'Unlike' : 'Like'}
          >
            {busyLike ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={cn('h-4 w-4', liked && 'text-[var(--gb-like)] fill-current')}
              />
            )}
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            className="gb-chip h-9 w-9 rounded-full"
            aria-pressed={faved}
            onClick={() => onToggle('FAVORITE')}
            title={faved ? 'Unfavorite' : 'Favorite'}
          >
            {busyFav ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star
                className={cn('h-4 w-4', faved && 'text-[var(--gb-favorite)] fill-current')}
              />
            )}
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 rounded-full text-[var(--gb-ink-soft)] hover:bg-[var(--gb-accent-soft)]"
                  aria-label="More"
                >
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6} className="gb-menu p-1">
                <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void onDelete()} disabled={deleting}>
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </article>
  );
}
