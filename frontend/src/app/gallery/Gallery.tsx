/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Gallery, getGallery } from '@/api/gallery';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import Highlight from '@tiptap/extension-highlight';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { FontSize } from 'reactjs-tiptap-editor/lib/FontSize.js';
import { TextAlign } from 'reactjs-tiptap-editor/lib/TextAlign.js';
import Comment from './galleryComment/Comment';
import { rewriteImageSrcs } from '@/lib/s3Utils';

const extensions = [
  StarterKit,
  Image,
  ImageResize,
  TextAlign,
  Color,
  FontFamily,
  FontSize,
  TextStyle,
  Highlight,
];

export default function GalleryPage() {
  // { children }: GalleryProps
  const [gallery, setGallery] = useState<Gallery>();
  const [content, setContent] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const { galleryId } = useParams();
  // const galleryIdInt =
  //   galleryId != undefined ? parseInt(galleryId, 10) : undefined;

  const editor = useEditor({
    editorProps: {
      attributes: {
        class: 'focus:outline-none border-[#C7C7C7]',
      },
    },
    editable: false,
    extensions,
    content,
  });
  useEffect(() => {
    setLoading(true);
    getGallery(galleryId).then((data) => {
      setGallery(data);
      if (data.content) {
        const cdnReadyContent = rewriteImageSrcs(JSON.parse(data.content));
        editor?.commands.setContent(cdnReadyContent);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 p-4 justify-between">
      <h3>Gallery Item: {galleryId}</h3>
      {/* {content && content.length > 0 && ( */}
      <div>
        <EditorContent editor={editor} />

        {/* <TipTapRenderer {...{ content: content }} /> */}
        {/* <CommentPanel /> */}
        <Comment galleryId={Number(galleryId)} />
      </div>
      {/* )} */}
    </div>
  );
}
