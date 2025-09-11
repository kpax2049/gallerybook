/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useParams /*, useNavigate */ } from 'react-router-dom';
import { getGallery, getGalleryBySlug } from '@/api/gallery';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TextStyle from '@tiptap/extension-text-style';
import Comment from './galleryComment/Comment';
import { useInView } from 'react-intersection-observer';
import { generateHTML } from '@tiptap/html';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { Color } from 'reactjs-tiptap-editor/color';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn';
import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Table } from 'reactjs-tiptap-editor/table';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import 'yet-another-react-lightbox/styles.css';
import 'yet-another-react-lightbox/plugins/thumbnails.css';

export interface GalleryBlock {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}
export interface GalleryData {
  type: string;
  content: GalleryBlock[];
}

const chunkSize = 2;

export default function GalleryPage() {
  const [loading, setLoading] = useState<boolean>(false);
  const { slug, galleryId } = useParams<{
    slug?: string;
    galleryId?: string;
  }>();

  const [title, setTitle] = useState<string>('');
  const [numericId, setNumericId] = useState<number | null>(null);

  const [rawBlocks, setRawBlocks] = useState<GalleryBlock[]>([]);
  const [htmlChunks, setHtmlChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const { ref, inView } = useInView();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [slides, setSlides] = useState<{ src: string; alt?: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load gallery by slug or id
  useEffect(() => {
    const param = slug ?? galleryId ?? '';
    if (!param) return;

    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        // reset chunked rendering state for a fresh load
        setRawBlocks([]);
        setHtmlChunks([]);
        setChunkIndex(0);
        setSlides([]);

        const isNumeric = /^\d+$/.test(param);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = isNumeric
          ? await getGallery(Number(param))
          : await getGalleryBySlug(param);

        if (cancelled) return;

        setTitle(data?.title ?? 'Gallery');
        setNumericId(Number(data?.id) || null);

        const blocks: GalleryBlock[] = data?.content?.content || [];
        setRawBlocks(blocks);

        // initial chunk
        const firstChunk = blocks.slice(0, chunkSize);
        const html = generateHTML({ type: 'doc', content: firstChunk }, [
          Image,
          StarterKit,
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
          ColumnActionButton,
          Table,
          Emoji,
        ]);
        setHtmlChunks([html]);
        setChunkIndex(1);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setError(e?.message ?? 'Failed to load gallery');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [slug, galleryId]);

  // Load next chunk when sentinel comes into view
  useEffect(() => {
    if (!inView || isLoadingChunk) return;
    if (chunkIndex * chunkSize >= rawBlocks.length) return;

    let cancelled = false;

    const loadNextChunk = async () => {
      setIsLoadingChunk(true);

      const start = chunkIndex * chunkSize;
      const end = start + chunkSize;
      const nextChunk = rawBlocks.slice(start, end);

      const html = generateHTML({ type: 'doc', content: nextChunk }, [
        Document,
        Paragraph,
        Text,
        Image,
      ]);

      if (!cancelled) {
        setHtmlChunks((prev) => [...prev, html]);
        setChunkIndex((prev) => prev + 1);
      }

      setTimeout(() => !cancelled && setIsLoadingChunk(false), 200);
    };

    void loadNextChunk();
    return () => {
      cancelled = true;
    };
  }, [inView, isLoadingChunk, chunkIndex, rawBlocks]);

  // Build slides whenever chunks change
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
    const s = imgs.map((img) => ({
      src: img.getAttribute('data-full') || img.src,
      alt: img.alt || undefined,
    }));
    setSlides(s);
  }, [htmlChunks]);

  // Delegate clicks from images to open lightbox at that index
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      const img = t?.closest?.('img') as HTMLImageElement | null;
      if (!img || !root.contains(img)) return;

      const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
      const idx = imgs.indexOf(img);
      if (idx >= 0) {
        setLbIndex(idx);
        setOpen(true);
      }
    };

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 p-4 justify-between">
      <div className="flex items-baseline gap-2">
        <h3 className="text-lg font-semibold">{title || 'Gallery'}</h3>
        {loading && (
          <span className="text-xs text-muted-foreground">Loading…</span>
        )}
        {error && <span className="text-xs text-destructive">{error}</span>}
      </div>

      <div
        className="gallery-container px-4 space-y-8 pb-12 [&_img]:cursor-zoom-in"
        ref={containerRef}
      >
        {htmlChunks.map((html, i) => (
          <div key={i}>
            <div dangerouslySetInnerHTML={{ __html: html }} />
            {/* Attach ref ONLY to last chunk if more chunks remain */}
            {i === htmlChunks.length - 1 &&
              chunkIndex * chunkSize < rawBlocks.length && (
                <div ref={ref} className="h-16" />
              )}
          </div>
        ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={lbIndex}
        slides={slides}
        plugins={[Zoom, Thumbnails]}
        controller={{ closeOnBackdropClick: true }}
      />

      {/* Always pass the numeric id to comments (works for slug or id routes) */}
      {numericId != null && <Comment galleryId={numericId} />}
    </div>
  );
}
