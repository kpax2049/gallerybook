import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { deleteGallery, Gallery, toggleReaction } from '@/api/gallery';
import { ThreeDotMenu } from '@/components/three-dot-menu';
import { TagStrip } from '@/components/ui/tags-strip';

type Props = {
  item: Gallery;
  comments: number;
  myReaction?: { like: boolean; favorite: boolean };
  onReactionChanged?: (next: { like?: boolean; favorite?: boolean }) => void;
  likesCountOverride?: number;
  favoritesCountOverride?: number;
  to?: string;
};

export const GalleryCard = React.memo(function GalleryCard({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
  to = '#',
}: Props) {
  const navigate = useNavigate();

  const onEdit = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e && e.stopPropagation) e.stopPropagation();
    navigate(`/galleries/edit/${item.id}`);
  };

  const onDelete = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (e && e.stopPropagation) e.stopPropagation();
    deleteGallery(item.id);
  };

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

  const Figure = (
    <figure
      className={cn(
        'block w-full select-none rounded-[14px] p-3',
        'bg-card text-card-foreground border border-border',
        'shadow-sm hover:shadow-md transition-shadow',
        'rotate-[-0.75deg] transition-transform duration-300 group-hover:rotate-0'
      )}
    >
      {/* Photo card */}
      <Card className="relative w-full rounded-[10px] overflow-hidden border border-border/60 bg-background">
        {/* Photo */}
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

        {/* Hover overlay (actions + stats/labels) */}
        <div
          className="
            pointer-events-none absolute inset-0
            md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100
            transition-opacity
          "
        >
          {/* Top-right actions */}
          <div className="pointer-events-auto absolute top-2 right-2 flex gap-1">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/70 backdrop-blur"
              title={liked ? 'Unlike' : 'Like'}
              aria-pressed={liked}
              onClick={(e) => handleToggle('LIKE', e)}
              data-stop-link="true"
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
              variant="secondary"
              className="h-8 w-8 rounded-full bg-background/70 backdrop-blur"
              title={faved ? 'Remove favorite' : 'Favorite'}
              aria-pressed={faved}
              onClick={(e) => handleToggle('FAVORITE', e)}
              data-stop-link="true"
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

          {/* Bottom gradient panel */}
          <div className="pointer-events-auto absolute inset-x-0 bottom-0">
            <div className="bg-gradient-to-t from-black/60 via-black/20 to-transparent text-white">
              <div className="p-3 space-y-2">
                <div className="text-[11px] opacity-80">
                  {item.updatedAt &&
                    new Date(item.updatedAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 opacity-90">
                    <Heart className="h-3.5 w-3.5" aria-hidden />
                    {likesCountOverride ?? item.likesCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 opacity-90">
                    <Star className="h-3.5 w-3.5" aria-hidden />
                    {favoritesCountOverride ?? item.favoritesCount ?? 0}
                  </span>
                  <span className="inline-flex items-center gap-1 opacity-90">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    {comments}
                  </span>
                </div>
                <TagStrip
                  tags={Array.isArray(item.tags) ? item.tags : []}
                  maxVisible={3}
                  dense
                />
              </div>
            </div>
          </div>
        </div>
        {/* User avatar and username chip; show on hover */}
        <div
          className={cn(
            'absolute top-3 left-3 z-[2]',
            'md:opacity-0 md:pointer-events-none md:-translate-x-2 md:-translate-y-2 md:scale-95',
            'md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-hover:translate-x-0 md:group-hover:translate-y-0 md:group-hover:scale-100',
            'md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-x-0 md:group-focus-within:translate-y-0 md:group-focus-within:scale-100',
            'transition duration-300 ease-out will-change-transform will-change-opacity'
          )}
        >
          <div
            className="
      relative rounded-xl border border-black/5 ring-1 ring-black/5
      bg-[#f8f5f0]/95 shadow-sm px-2.5 py-1.5
      backdrop-blur-[2px]
    "
          >
            <div
              className="
        pointer-events-none absolute inset-0 rounded-xl opacity-40
        [background-image:radial-gradient(rgba(0,0,0,0.06)_1px,transparent_1px)]
        [background-size:8px_8px]
      "
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/70 rounded-t-xl" />
            <div className="relative flex items-center gap-2">
              {item.author?.avatarUrl ? (
                <img
                  src={item.author.avatarUrl}
                  alt={item.author.displayName ?? item.author.username}
                  className="w-7 h-7 rounded-full ring-1 ring-black/10 object-cover"
                />
              ) : (
                <div className="w-7 h-7 rounded-full ring-1 ring-black/10 bg-slate-300 text-slate-700 grid place-items-center text-xs font-semibold">
                  {(item.author?.displayName ?? item.author?.username ?? 'GB')
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((s) => s[0]?.toUpperCase())
                    .join('') || 'U'}
                </div>
              )}

              <div className="leading-tight">
                <div className="text-[10px] uppercase tracking-[0.15em] text-slate-600">
                  by
                </div>
                <div className="text-[13px] italic tracking-wide text-slate-800">
                  {item.author?.username ?? item.author?.displayName}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Caption under the photo */}
      <figcaption className="mt-2 px-2">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[13px] font-medium text-foreground leading-tight line-clamp-1">
            {item.title ?? 'Untitled gallery'}
          </div>
          <ThreeDotMenu onEdit={onEdit} onDelete={onDelete} gallery={item} />
        </div>
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
