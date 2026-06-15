import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Download,
  Heart,
  ImagePlus,
  Loader2,
  Maximize2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { generateHTML } from '@tiptap/html';
import { mergeAttributes, Node } from '@tiptap/core';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { Color } from 'reactjs-tiptap-editor/color';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { Column } from 'reactjs-tiptap-editor/column';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Table } from 'reactjs-tiptap-editor/table';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteGallery, Gallery, getGallery, getGalleryBySlug, toggleReaction } from '@/api/gallery';
import Comment from './galleryComment/Comment';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { isAdmin } from '@/lib/authz';
import { DeskHeader } from './GalleriesPage';

export interface GalleryBlock {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

type GalleryPhoto = {
  src: string;
  alt?: string;
  title: string;
  meta: string;
};

const GalleryEmoji = Node.create({
  name: 'emoji',
  inline: true,
  group: 'inline',
  selectable: false,

  addAttributes() {
    return {
      name: {
        default: null,
      },
    };
  },

  renderHTML({ HTMLAttributes, node }) {
    const name = node.attrs.name;
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'emoji',
        'data-name': name,
      }),
      name ? `:${name}:` : '',
    ];
  },
});

const galleryRenderExtensions = [
  Image,
  StarterKit.configure({
    bold: false,
    italic: false,
    strike: false,
    bulletList: false,
    underline: false,
  }),
  TextStyle,
  FontFamily,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  Color,
  Highlight,
  BulletList,
  TextAlign,
  Indent,
  Column,
  Table,
  GalleryEmoji,
];

export default function GalleryPage() {
  const navigate = useNavigate();
  const currentUser = useUserStore((state) => state.user);
  const { slug, galleryId } = useParams<{ slug?: string; galleryId?: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [numericId, setNumericId] = useState<number | null>(null);
  const [rawBlocks, setRawBlocks] = useState<GalleryBlock[]>([]);
  const [richHtml, setRichHtml] = useState('');
  const [open, setOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [busyReaction, setBusyReaction] = useState<'LIKE' | 'FAVORITE' | null>(
    null
  );

  useEffect(() => {
    const param = slug ?? galleryId ?? '';
    if (!param) return;

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        setGallery(null);
        setRawBlocks([]);
        setRichHtml('');

        const isNumeric = /^\d+$/.test(param);
        const data = isNumeric
          ? await getGallery(Number(param))
          : await getGalleryBySlug(param);

        if (cancelled) return;

        setGallery(data);
        setNumericId(Number(data?.id) || null);
        setLikesCount(data.likesCount ?? 0);
        setFavoritesCount(data.favoritesCount ?? 0);

        const blocks: GalleryBlock[] = Array.isArray(data?.content?.content)
          ? data.content.content
          : [];
        setRawBlocks(blocks);
        setRichHtml(
          generateHTML({ type: 'doc', content: blocks }, galleryRenderExtensions)
        );
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Failed to load gallery';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [slug, galleryId]);

  const photos = useMemo(() => extractPhotos(rawBlocks), [rawBlocks]);
  const slides = useMemo(
    () => photos.map((photo) => ({ src: photo.src, alt: photo.alt })),
    [photos]
  );
  const title = gallery?.title ?? 'Gallery';
  const photoCount = photos.length;
  const canManage = isAdmin(currentUser) && numericId != null;

  const handleDelete = async () => {
    if (!numericId || deleting) return;

    setDeleting(true);
    try {
      await deleteGallery(numericId);
      navigate('/galleries', { replace: true });
    } catch (deleteError) {
      console.error(deleteError);
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const toggleGalleryReaction = async (type: 'LIKE' | 'FAVORITE') => {
    if (!numericId || busyReaction) return;
    const isLike = type === 'LIKE';
    const previous = isLike ? liked : favorited;
    setBusyReaction(type);

    if (isLike) {
      setLiked(!previous);
      setLikesCount((count) => count + (previous ? -1 : 1));
    } else {
      setFavorited(!previous);
      setFavoritesCount((count) => count + (previous ? -1 : 1));
    }

    try {
      const response = await toggleReaction(numericId, type);
      const active =
        typeof response?.active === 'boolean' ? response.active : !previous;
      if (isLike) {
        setLiked(active);
        setLikesCount((count) => count + (active === !previous ? 0 : active ? 1 : -1));
      } else {
        setFavorited(active);
        setFavoritesCount((count) => count + (active === !previous ? 0 : active ? 1 : -1));
      }
    } catch (reactionError) {
      if (isLike) {
        setLiked(previous);
        setLikesCount((count) => count + (previous ? 1 : -1));
      } else {
        setFavorited(previous);
        setFavoritesCount((count) => count + (previous ? 1 : -1));
      }
      console.error(reactionError);
    } finally {
      setBusyReaction(null);
    }
  };

  return (
    <div className="gb-page">
      <DeskHeader onCreate={() => navigate('/galleries/new')} />
      <main className="gb-shell px-0 pb-[70px] pt-5 sm:px-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/galleries"
            className="gb-chip inline-flex h-10 items-center rounded-[11px] px-3 text-sm"
          >
            My Galleries
          </Link>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/galleries/edit/${numericId}`)}
              disabled={!gallery}
              className="gb-chip h-10 rounded-[11px] px-3"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit album
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 px-0 text-sm text-[var(--gb-ink-mute)]">
          <Link to="/galleries" className="hover:text-[var(--gb-ink)]">
            My Galleries
          </Link>
          <span>/</span>
          <span className="truncate text-[var(--gb-ink-soft)]">{title}</span>
        </div>

        <section className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            {loading && !gallery ? (
              <HeaderSkeleton />
            ) : (
              <>
                <h1 className="gb-serif text-[34px] font-medium leading-[1.05] tracking-normal text-[var(--gb-ink)]">
                  {title}
                </h1>
                <div className="gb-hand mt-1 text-[22px] font-semibold text-[var(--gb-hand)]">
                  {photoCount.toLocaleString()} photos
                  {gallery?.updatedAt
                    ? ` · updated ${new Date(gallery.updatedAt).toLocaleDateString()}`
                    : ''}
                </div>
                {gallery?.description && (
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--gb-ink-soft)]">
                    {gallery.description}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(gallery?.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-[var(--gb-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--gb-accent)]"
                    >
                      {tag}
                    </span>
                  ))}
                  {(gallery?.tags?.length ?? 0) > 0 && (
                    <span className="mx-1 h-4 w-px bg-[var(--gb-border-2)]" />
                  )}
                  <Stat icon={<Heart className="h-3.5 w-3.5" />} value={likesCount} />
                  <Stat icon={<Star className="h-3.5 w-3.5" />} value={favoritesCount} />
                  <Stat icon={<MessageSquare className="h-3.5 w-3.5" />} value="Comments" />
                </div>
              </>
            )}
            {error && (
              <div className="mt-4 rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <IconAction
              label={favorited ? 'Remove favorite' : 'Favorite'}
              active={favorited}
              activeClass="text-[var(--gb-favorite)]"
              busy={busyReaction === 'FAVORITE'}
              onClick={() => void toggleGalleryReaction('FAVORITE')}
            >
              <Star className={cn('h-4 w-4', favorited && 'fill-current')} />
            </IconAction>
            <IconAction
              label={liked ? 'Unlike' : 'Like'}
              active={liked}
              activeClass="text-[var(--gb-like)]"
              busy={busyReaction === 'LIKE'}
              onClick={() => void toggleGalleryReaction('LIKE')}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            </IconAction>
            <IconAction label="Share">
              <Share2 className="h-4 w-4" />
            </IconAction>
            {canManage && (
              <Button
                type="button"
                onClick={() => setDeleteOpen(true)}
                disabled={deleting}
                className="h-10 rounded-[11px] border border-red-500/30 bg-red-500/12 px-3 text-red-500 shadow-none hover:bg-red-500/18"
              >
                {deleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>
            )}
          </div>
        </section>

        <section className="mt-9 space-y-[34px]" ref={containerRef}>
          {loading && !gallery ? (
            Array.from({ length: 3 }).map((_, index) => (
              <PhotoPageSkeleton key={index} />
            ))
          ) : photos.length > 0 ? (
            photos.map((photo, index) => (
              <PhotoPage
                key={`${photo.src}-${index}`}
                photo={photo}
                index={index}
                onOpen={() => {
                  setLbIndex(index);
                  setOpen(true);
                }}
              />
            ))
          ) : (
            <RichContentFallback html={richHtml} />
          )}

          {canManage && (
            <button
              type="button"
              onClick={() => navigate(`/galleries/edit/${numericId}`)}
              className="gb-chip flex w-full flex-col items-center justify-center gap-2 rounded-[7px] border-dashed border-[var(--gb-border-2)] bg-[var(--gb-surface)] p-10 text-center text-[var(--gb-ink-soft)] hover:border-[var(--gb-accent)] hover:bg-[var(--gb-accent-soft)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--gb-border-2)]">
                <ImagePlus className="h-5 w-5" />
              </span>
              <span className="gb-hand text-[23px] font-semibold">
                Add photos to this album
              </span>
              <span className="text-[11.5px] text-[var(--gb-ink-mute)]">
                Open the editor to upload or rearrange photos
              </span>
            </button>
          )}
        </section>

        <Lightbox
          open={open}
          close={() => setOpen(false)}
          index={lbIndex}
          slides={slides}
          plugins={[Zoom, Thumbnails]}
          controller={{ closeOnBackdropClick: true }}
        />

        {numericId != null && (
          <section className="mt-10 rounded-[15px] border border-[var(--gb-border)] bg-[var(--gb-surface-2)] p-4">
            <Comment galleryId={numericId} />
          </section>
        )}
      </main>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="gb-panel border-0 text-[var(--gb-ink)] sm:max-w-[420px]">
          <DialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-[12px] bg-red-500/12 text-red-500">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="gb-serif text-[22px] font-medium">
              Delete this album?
            </DialogTitle>
            <DialogDescription className="text-[var(--gb-ink-soft)]">
              “{title}” and its {photoCount.toLocaleString()} photos will be
              permanently removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              className="gb-chip rounded-[11px]"
            >
              Keep it
            </Button>
            <Button
              type="button"
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="rounded-[11px] bg-red-500 text-white hover:bg-red-600"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete album
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PhotoPage({
  photo,
  index,
  onOpen,
}: {
  photo: GalleryPhoto;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article
      className="gb-album-page"
      style={{ '--gb-delay': `${index * 45}ms` } as React.CSSProperties}
    >
      <div className="gb-album-photo-wrap">
        <img
          src={photo.src}
          alt={photo.alt ?? photo.title}
          className="gb-album-photo"
          loading="lazy"
        />
        <span className="gb-photo-corner left-0 top-0 [clip-path:polygon(0_0,100%_0,0_100%)]" />
        <span className="gb-photo-corner right-0 top-0 [clip-path:polygon(100%_0,0_0,100%_100%)]" />
        <span className="gb-photo-corner bottom-0 left-0 [clip-path:polygon(0_100%,0_0,100%_100%)]" />
        <span className="gb-photo-corner bottom-0 right-0 [clip-path:polygon(100%_100%,100%_0,0_100%)]" />
        <div className="gb-photo-actions">
          <button type="button" onClick={onOpen} aria-label="Open image">
            <Maximize2 className="h-4 w-4" />
          </button>
          <a href={photo.src} download aria-label="Download image">
            <Download className="h-4 w-4" />
          </a>
          <button type="button" aria-label="More image actions">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
      <footer className="flex items-center justify-between gap-3 px-1 py-3">
        <div className="gb-hand min-w-0 truncate text-[25px] font-semibold leading-none text-[var(--gb-paper-ink)]">
          {photo.title}
        </div>
        <div className="shrink-0 text-[11.5px] text-[#8d7c65]">
          {photo.meta}
        </div>
      </footer>
    </article>
  );
}

function RichContentFallback({ html }: { html: string }) {
  return (
    <article className="gb-album-page">
      <div
        className="gallery-container gb-rich-gallery-content px-2 py-3"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </article>
  );
}

function IconAction({
  label,
  children,
  active,
  activeClass,
  busy,
  onClick,
}: {
  label: string;
  children: React.ReactNode;
  active?: boolean;
  activeClass?: string;
  busy?: boolean;
  onClick?: () => void;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'gb-chip h-10 w-10 rounded-[11px] text-[var(--gb-ink-soft)]',
        active && activeClass
      )}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </Button>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[12.5px] text-[var(--gb-ink-mute)]">
      {icon}
      {value}
    </span>
  );
}

function HeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-6 w-44" />
      <Skeleton className="h-4 w-full max-w-xl" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

function PhotoPageSkeleton() {
  return (
    <div className="gb-album-page">
      <Skeleton className="h-[420px] rounded-[3px]" />
      <div className="flex justify-between py-3">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-4 w-28" />
      </div>
    </div>
  );
}

function extractPhotos(blocks: GalleryBlock[]): GalleryPhoto[] {
  const photos: GalleryPhoto[] = [];

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const current = node as GalleryBlock;
    if (current.type === 'image') {
      const attrs = current.attrs ?? {};
      const src = attrs.src ?? attrs['data-full'];
      if (typeof src === 'string' && src.length > 0) {
        photos.push({
          src,
          alt: typeof attrs.alt === 'string' ? attrs.alt : undefined,
          title: imageTitle(attrs, photos.length),
          meta: imageMeta(attrs),
        });
      }
    }
    if (Array.isArray(current.content)) current.content.forEach(walk);
  };

  blocks.forEach(walk);
  return photos;
}

function imageTitle(attrs: Record<string, unknown>, index: number) {
  const title = attrs.title ?? attrs.alt ?? attrs.name;
  if (typeof title === 'string' && title.trim()) return title.trim();
  return `Photo ${String(index + 1).padStart(2, '0')}`;
}

function imageMeta(attrs: Record<string, unknown>) {
  const width = Number(attrs.width);
  const height = Number(attrs.height);
  const dimensions =
    Number.isFinite(width) && Number.isFinite(height)
      ? `${width} x ${height}`
      : null;
  const type =
    typeof attrs.type === 'string'
      ? attrs.type.toUpperCase()
      : typeof attrs.mimeType === 'string'
        ? attrs.mimeType.split('/').pop()?.toUpperCase()
        : null;
  return [dimensions, type].filter(Boolean).join(' · ') || 'Gallery photo';
}
