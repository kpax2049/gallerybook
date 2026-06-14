import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Star,
  UserPlus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { deleteGallery, Gallery, toggleReaction } from '@/api/gallery';
import { getUserInitials } from '@/api/user';
import { useUserStore } from '@/stores/userStore';
import { isAdmin } from '@/lib/authz';

type Props = {
  item: Gallery;
  comments: number;
  myReaction?: { like: boolean; favorite: boolean };
  onReactionChanged?: (next: { like?: boolean; favorite?: boolean }) => void;
  likesCountOverride?: number;
  favoritesCountOverride?: number;
  onDeleted?: (id: number) => void;
  onEditRequested?: () => void;
  style?: React.CSSProperties;
  to?: string;
};

export const GalleryCard = React.memo(function GalleryCard({
  item,
  comments,
  myReaction,
  onReactionChanged,
  likesCountOverride,
  favoritesCountOverride,
  onDeleted,
  onEditRequested,
  style,
  to = '#',
}: Props) {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const canManage = isAdmin(currentUser);
  const [deleting, setDeleting] = React.useState(false);
  const [busyLike, setBusyLike] = React.useState(false);
  const [busyFav, setBusyFav] = React.useState(false);
  const liked = !!myReaction?.like;
  const faved = !!myReaction?.favorite;
  const authorName = item.author?.displayName ?? item.author?.username ?? 'admin';
  const likesDisplay = likesCountOverride ?? item.likesCount ?? 0;
  const favsDisplay = favoritesCountOverride ?? item.favoritesCount ?? 0;
  const tags = Array.isArray(item.tags) ? item.tags : [];

  const onEdit = (event?: Event) => {
    event?.preventDefault();
    if (onEditRequested) onEditRequested();
    else navigate(`/galleries/edit/${item.id}`);
  };

  const onDelete = async (event?: Event) => {
    event?.preventDefault();
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

  const handleToggle = async (
    type: 'LIKE' | 'FAVORITE',
    event?: React.MouseEvent
  ) => {
    event?.preventDefault();
    event?.stopPropagation();
    const isLike = type === 'LIKE';
    const setBusy = isLike ? setBusyLike : setBusyFav;
    setBusy(true);
    try {
      const res = await toggleReaction(item.id, type);
      const active =
        typeof res?.active === 'boolean'
          ? res.active
          : isLike
            ? !liked
            : !faved;
      onReactionChanged?.(isLike ? { like: active } : { favorite: active });
    } finally {
      setBusy(false);
    }
  };

  const figure = (
    <figure className="gb-paper gb-print-card group p-[11px] pb-0" style={style}>
      {faved && (
        <span className="absolute right-5 top-6 z-10 flex h-8 w-8 rotate-12 items-center justify-center rounded-full bg-[var(--gb-paper)] text-[var(--gb-favorite)] shadow-md">
          <Star className="h-4 w-4 fill-current" />
        </span>
      )}

      <div className="relative h-[184px] overflow-hidden rounded-sm bg-[var(--gb-surface)]">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title ?? 'cover'}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-[var(--gb-ink-mute)]">
            No cover
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/12 to-black/72 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <div className="flex translate-y-[-8px] items-center justify-between p-3 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="inline-flex min-w-0 items-center gap-2 rounded-full bg-black/40 py-1 pl-1 pr-2 text-white backdrop-blur">
              <Avatar className="h-6 w-6">
                <AvatarImage src={item.author?.avatarUrl} alt={authorName} />
                <AvatarFallback className="text-[10px]">
                  {getUserInitials(item.author)}
                </AvatarFallback>
              </Avatar>
              <span className="max-w-24 truncate text-xs font-medium">
                {authorName}
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-6 w-6 rounded-full text-white hover:bg-white/15 hover:text-white"
                data-stop-link="true"
                aria-label={`Follow ${authorName}`}
                onClick={(event) => event.preventDefault()}
              >
                <UserPlus className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex gap-1">
              <ReactionButton
                active={liked}
                busy={busyLike}
                label={liked ? 'Unlike' : 'Like'}
                activeClass="text-[var(--gb-like)]"
                onClick={(event) => handleToggle('LIKE', event)}
              >
                <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
              </ReactionButton>
              <ReactionButton
                active={faved}
                busy={busyFav}
                label={faved ? 'Remove favorite' : 'Favorite'}
                activeClass="text-[var(--gb-favorite)]"
                onClick={(event) => handleToggle('FAVORITE', event)}
              >
                <Star className={cn('h-4 w-4', faved && 'fill-current')} />
              </ReactionButton>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 translate-y-3 space-y-2 p-3 text-white opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <div className="text-[11px] text-white/78">
              {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Recently updated'}
            </div>
            <div className="flex items-center gap-3 text-xs">
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
            <div className="flex flex-wrap gap-1">
              {tags.slice(0, 3).map((tag) => (
                <span key={tag} className="max-w-24 truncate rounded-full bg-white/18 px-2 py-0.5 text-[11px]">
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="rounded-full bg-white/18 px-2 py-0.5 text-[11px]">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <figcaption className="flex h-[58px] items-center gap-2 px-2">
        <div className="min-w-0 flex-1">
          <div className="gb-hand truncate text-[23px] font-semibold leading-none text-[var(--gb-hand)]">
            {item.title ?? 'Untitled gallery'}
          </div>
          <div className="mt-1 text-[11.5px] text-[var(--gb-ink-mute)]">
            {item.viewsCount ?? 0} views
          </div>
        </div>

        {canManage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full text-[var(--gb-paper-ink)] opacity-0 transition hover:bg-black/5 group-hover:opacity-100 focus:opacity-100"
                data-stop-link="true"
                aria-label="Gallery actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="gb-menu p-1">
              <DropdownMenuItem onSelect={onEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem onSelect={onDelete} disabled={deleting}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </figcaption>
    </figure>
  );

  return to ? (
    <Link
      to={to}
      aria-label={item.title ?? 'Open gallery'}
      className="block rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
      onClickCapture={(event) => {
        const el = event.target as Element | null;
        if (el?.closest?.("[data-stop-link='true']")) event.preventDefault();
      }}
    >
      {figure}
    </Link>
  ) : (
    figure
  );
});

function ReactionButton({
  active,
  busy,
  label,
  activeClass,
  onClick,
  children,
}: {
  active: boolean;
  busy: boolean;
  label: string;
  activeClass: string;
  onClick: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'h-8 w-8 rounded-full bg-black/40 text-white backdrop-blur hover:bg-white/18 hover:text-white',
        active && activeClass
      )}
      data-stop-link="true"
      onClick={onClick}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}
