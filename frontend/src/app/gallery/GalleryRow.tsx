import * as React from 'react';
import { Link } from 'react-router-dom';
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
import { Gallery, toggleReaction } from '@/api/gallery';

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
};

export function GalleryRow({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
}: RowProps) {
  const [busyLike, setBusyLike] = React.useState(false);
  const [busyFav, setBusyFav] = React.useState(false);
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

  return (
    <li className="p-3 hover:bg-muted/30">
      <div className="flex items-center gap-3">
        <Link to={`/galleries/${item.id}`} className="block shrink-0">
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
          <Link to={`/galleries/${item.id}`} className="block">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                aria-label="More"
              >
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={6}>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault() /* navigate/edit */}
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault() /* delete */}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </li>
  );
}
