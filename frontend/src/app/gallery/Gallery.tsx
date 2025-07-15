/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Gallery, getGallery } from '@/api/gallery';
// import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
// import ImageResize from 'tiptap-extension-resize-image';
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
// import { Heading } from 'reactjs-tiptap-editor/heading';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn';
import { Emoji } from 'reactjs-tiptap-editor/emoji';
// import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Indent } from 'reactjs-tiptap-editor/indent';
// import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Table } from 'reactjs-tiptap-editor/table';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';
// const extensions = [
//   StarterKit,
//   Image,
//   ImageResize,
//   TextAlign,
//   Color,
//   FontFamily,
//   FontSize,
//   TextStyle,
//   Highlight,
// ];

interface GalleryBlock {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

const chunkSize = 2;

export default function GalleryPage() {
  const [gallery, setGallery] = useState<Gallery>();
  const [content, setContent] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const { galleryId } = useParams();
  const [rawBlocks, setRawBlocks] = useState<GalleryBlock[]>([]);
  const [htmlChunks, setHtmlChunks] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const { ref, inView } = useInView();

  // const galleryIdInt =
  //   galleryId != undefined ? parseInt(galleryId, 10) : undefined;

  // const editor = useEditor({
  //   editorProps: {
  //     attributes: {
  //       class: 'focus:outline-none border-[#C7C7C7]',
  //     },
  //   },
  //   editable: false,
  //   extensions,
  //   content,
  // });
  useEffect(() => {
    setLoading(true);
    getGallery(galleryId).then((data) => {
      setGallery(data);
      if (data.content) {
        const jsonContent = JSON.parse(data.content);
        setRawBlocks(jsonContent.content || []);

        const firstChunk = jsonContent.content.slice(0, chunkSize);
        const html = generateHTML({ type: 'doc', content: firstChunk }, [
          // Document,
          // Paragraph,
          // Text,
          Image,
          StarterKit,
          TextStyle,
          FontFamily,
          // Heading,
          FontSize,
          Bold,
          Italic,
          TextUnderline,
          Strike,
          Color,
          Highlight,
          BulletList,
          // OrderedList,
          TextAlign,
          Indent,
          // HorizontalRule,
          ColumnActionButton,
          Table,
          Emoji,
        ]);
        setHtmlChunks([html]);
        setChunkIndex(1);
        // editor?.commands.setContent(cdnReadyContent);
      }
      setLoading(false);
    });
  }, []);

  // useEffect(() => {
  //   console.log('htmlChunks.length changed:', htmlChunks.length);
  // }, [htmlChunks]);

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

  return (
    <div className="grid auto-rows-min gap-4 p-4 justify-between">
      <h3>Gallery Item: {galleryId}</h3>
      {/* <EditorContent editor={editor} /> */}
      <div className="gallery-container px-4 space-y-8 pb-12">
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
      <Comment galleryId={Number(galleryId)} />
    </div>
  );
}
