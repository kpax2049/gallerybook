/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getGallery } from '@/api/gallery';
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
  const { galleryId } = useParams();
  const [rawBlocks, setRawBlocks] = useState<GalleryBlock[]>([]);
  const [htmlChunks, setHtmlChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const { ref, inView } = useInView();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);
  const [slides, setSlides] = useState<{ src: string; alt?: string }[]>([]);

  useEffect(() => {
    setLoading(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getGallery(galleryId).then((data: any) => {
      if (data?.content) {
        setRawBlocks(data?.content?.content || []);
        const firstChunk = data?.content?.content?.slice(0, chunkSize);
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
      }
      setLoading(false);
    });
  }, []);

  // Load next chunk when sentinel comes into view
  useEffect(() => {
    if (!inView || isLoadingChunk) return;
    if (chunkIndex * chunkSize >= rawBlocks.length) return; // no more chunks

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

      setHtmlChunks((prev) => [...prev, html]);
      setChunkIndex((prev) => prev + 1);

      // Delay releasing flag to let observer reattach
      setTimeout(() => setIsLoadingChunk(false), 200);
    };

    loadNextChunk();
  }, [inView, isLoadingChunk, chunkIndex, rawBlocks]);

  // Build slides whenever chunks change (keeps correct global order)
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('img'));
    const s = imgs.map((img) => ({
      // if you provide data-full on <img>, use it; otherwise fall back to src
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
      if (!img) return;
      // prevent clicks from comments or other areas outside container
      if (!root.contains(img)) return;

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
      <h3>Gallery Item: {galleryId}</h3>
      <div
        className="gallery-container px-4 space-y-8 pb-12 [&_img]:cursor-zoom-in"
        ref={containerRef}
      >
        {htmlChunks.map((html, i) => {
          return (
            <div key={i}>
              <div dangerouslySetInnerHTML={{ __html: html }} />
              {/* Attach ref ONLY to last chunk if more chunks remain */}
              {i === htmlChunks.length - 1 &&
                chunkIndex * chunkSize < rawBlocks.length && (
                  <div ref={ref} className="h-16" />
                )}
            </div>
          );
        })}
      </div>
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={lbIndex}
        slides={slides}
        plugins={[Zoom, Thumbnails]}
        controller={{ closeOnBackdropClick: true }}
      />
      <Comment galleryId={Number(galleryId)} />
    </div>
  );
}
