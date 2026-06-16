import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Star,
  MessageSquare,
  Loader2,
  MoreHorizontal,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { deleteGallery, Gallery, toggleReaction } from '@/api/gallery';
import { useUserStore } from '@/stores/userStore';
import { isAdmin } from '@/lib/authz';

// tiny read-only tag strip (or import your TagStrip)
const TagStrip = ({ tags = [] as string[] }) => (
  <div className="flex flex-wrap items-center gap-1 min-w-0">
    {tags.slice(0, 4).map((t) => (
      <span
        key={t}
        className="px-1.5 py-0.5 text-[11px] rounded bg-muted text-muted-foreground max-w-[10rem] truncate"
      >
        {t}
      </span>
    ))}
    {tags.length > 4 && (
      <span className="px-1.5 py-0.5 text-[11px] rounded border text-muted-foreground">
        +{tags.length - 4}
      </span>
    )}
  </div>
);

type RowProps = {
  item: Gallery;
  comments: number;
  myReaction?: { like: boolean; favorite: boolean };
  onReactionChanged?: (next: { like?: boolean; favorite?: boolean }) => void;
  likesCountOverride?: number;
  favoritesCountOverride?: number;
  onDeleted?: (id: number) => void;
};

export function GalleryRow({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
  onDeleted,
}: RowProps) {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const canManage = isAdmin(currentUser);
  const [busyLike, setBusyLike] = React.useState(false);
  const [busyFav, setBusyFav] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const liked = !!myReaction?.like;
  const faved = !!myReaction?.favorite;

  const onToggle = async (type: 'LIKE' | 'FAVORITE') => {
    const isLike = type === 'LIKE';
    const setBusy = isLike ? setBusyLike : setBusyFav;

    setBusy(true);
    try {
      const res = await toggleReaction(item.id, type);
      const prev = isLike ? liked : faved;
      const active = typeof res?.active === 'boolean' ? res.active : !prev;

      if (isLike) {
        onReactionChanged?.({ like: active });
      } else {
        onReactionChanged?.({ favorite: active });
      }
    } finally {
      setBusy(false);
    }
  };

  const likesDisplay = likesCountOverride ?? item.likesCount ?? 0;
  const favsDisplay = favoritesCountOverride ?? item.favoritesCount ?? 0;

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

  return (
    <li
      className={cn(
        'relative p-3 hover:bg-muted/30',
        deleting && 'pointer-events-none opacity-75'
      )}
      aria-busy={deleting}
    >
      {deleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70 text-foreground backdrop-blur-sm">
          <div className="inline-flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Deleting...
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <Link
          to={`/galleries/${item.slug ?? item.id}`}
          className="block shrink-0"
        >
          <img
            src={item.thumbnail || ''}
            alt={item.title ?? 'cover'}
            className={cn(
              'h-16 w-24 rounded object-cover bg-muted',
              !item.thumbnail && 'opacity-60'
            )}
            loading="lazy"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <Link to={`/galleries/${item.slug ?? item.id}`} className="block">
            <div className="text-sm font-medium leading-tight truncate">
              {item.title ?? 'Untitled gallery'}
            </div>
          </Link>
          <div className="mt-1 flex items-center gap-3 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Heart className="h-3.5 w-3.5" aria-hidden />
              {likesDisplay}
            </span>
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5" aria-hidden />
              {favsDisplay}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden />
              {comments}
            </span>
          </div>
          <div className="mt-1">
            <TagStrip tags={Array.isArray(item.tags) ? item.tags : []} />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-pressed={liked}
            disabled={deleting}
            onClick={() => onToggle('LIKE')}
            title={liked ? 'Unlike' : 'Like'}
          >
            {busyLike ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Heart
                className={cn('h-4 w-4', liked && 'text-rose-500')}
                fill={liked ? 'currentColor' : 'none'}
                strokeWidth={liked ? 0 : 2}
              />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8"
            aria-pressed={faved}
            disabled={deleting}
            onClick={() => onToggle('FAVORITE')}
            title={faved ? 'Unfavorite' : 'Favorite'}
          >
            {busyFav ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Star
                className={cn('h-4 w-4', faved && 'text-amber-500')}
                fill={faved ? 'currentColor' : 'none'}
                strokeWidth={faved ? 0 : 2}
              />
            )}
          </Button>

          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  aria-label="More"
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-5 w-5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={6}>
                <DropdownMenuItem
                  disabled={deleting}
                  onSelect={() => navigate(`/galleries/edit/${item.id}`)}
                >
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={deleting}
                  onSelect={() => void onDelete()}
                >
                  {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {deleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </li>
  );
}
