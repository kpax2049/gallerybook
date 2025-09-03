import * as React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Gallery, toggleReaction } from '@/api/gallery';
import { InlineTagsEditor } from '@/components/ui/inlineTagsEditor';

type Props = {
  item: Gallery;
  comments: number;
  myReaction?: { like: boolean; favorite: boolean };
  onReactionChanged?: (next: { like?: boolean; favorite?: boolean }) => void;
  likesCountOverride?: number;
  favoritesCountOverride?: number;
  to?: string;
  onTagsChanged?: (tags: string[]) => void;
  canEditTags?: boolean;
};

export const GalleryCard = React.memo(function GalleryCard({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
  to = '#',
  onTagsChanged,
  canEditTags = false,
}: Props) {
  const [busyLike, setBusyLike] = React.useState(false);
  const [busyFav, setBusyFav] = React.useState(false);

  const liked = !!myReaction?.like;
  const faved = !!myReaction?.favorite;

  const handleToggle = async (
    type: 'LIKE' | 'FAVORITE',
    e?: React.MouseEvent
  ) => {
    e?.preventDefault();
    e?.stopPropagation();

    const isLike = type === 'LIKE';
    const setBusy = (v: boolean) => (isLike ? setBusyLike(v) : setBusyFav(v));

    setBusy(true);
    try {
      const res = await toggleReaction(item.id, type);
      const active =
        typeof res?.active === 'boolean'
          ? res.active
          : isLike
            ? !liked
            : !faved;

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

  const Figure = (
    <figure
      className={cn(
        'block w-full select-none rounded-[14px] p-3',
        // surface
        'bg-card text-card-foreground border border-border',
        // elevation & hover
        'shadow-sm hover:shadow-md transition-shadow',
        // the “polaroid tilt”
        'rotate-[-0.75deg] transition-transform duration-300 group-hover:rotate-0'
      )}
    >
      {/* Photo */}
      <Card className="w-full rounded-[10px] overflow-hidden">
        <div className="relative w-full aspect-[4/3] bg-muted">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title ?? 'cover'}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No cover
            </div>
          )}
        </div>
      </Card>

      {/* Caption: fixed 4 rows; last row constant height (so all cards match) */}
      <figcaption className="mt-2 px-2 grid grid-rows-[auto_auto_auto_28px] gap-y-1.5">
        {/* Row 1: title */}
        <div className="text-[13px] font-medium text-foreground line-clamp-1">
          {item.title ?? 'Untitled gallery'}
        </div>

        {/* Row 2: meta + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-muted-foreground">
            {item.updatedAt && (
              <>Updated {new Date(item.updatedAt).toLocaleDateString()}</>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="outline"
              aria-pressed={liked}
              title={liked ? 'Unlike' : 'Like'}
              onClick={(e) => handleToggle('LIKE', e)}
              disabled={busyLike}
              className="h-8 w-8 hover:bg-muted/60"
            >
              {busyLike ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Heart
                  className={cn(
                    'h-4 w-4',
                    liked ? 'text-rose-500' : 'text-foreground'
                  )}
                  fill={liked ? 'currentColor' : 'none'}
                  strokeWidth={liked ? 0 : 2}
                />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-pressed={faved}
              title={faved ? 'Remove favorite' : 'Favorite'}
              onClick={(e) => handleToggle('FAVORITE', e)}
              disabled={busyFav}
              className="h-8 w-8 hover:bg-muted/60"
            >
              {busyFav ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Star
                  className={cn(
                    'h-4 w-4',
                    faved ? 'text-amber-500' : 'text-foreground'
                  )}
                  fill={faved ? 'currentColor' : 'none'}
                  strokeWidth={faved ? 0 : 2}
                />
              )}
            </Button>
          </div>
        </div>

        {/* Row 3: counters */}
        <div className="text-[11px] text-muted-foreground flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <Heart className="h-3.5 w-3.5" />
            {likesDisplay}
          </span>
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5" />
            {favsDisplay}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {comments}
          </span>
        </div>

        {/* Row 4: tags (constant height) + inline editor popover */}
        <InlineTagsEditor
          galleryId={item.id}
          initial={Array.isArray(item.tags) ? item.tags : []}
          onUpdated={(next) => onTagsChanged?.(next)}
          editable={canEditTags}
        />
      </figcaption>
    </figure>
  );

  return to ? (
    <Link
      to={to}
      aria-label={item.title ?? 'Open gallery'}
      className="group block w-full rounded-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      onClickCapture={(e) => {
        const el = e.target as Element | null;
        if (el && el.closest?.("[data-stop-link='true']")) e.preventDefault();
      }}
    >
      {Figure}
    </Link>
  ) : (
    Figure
  );
});
