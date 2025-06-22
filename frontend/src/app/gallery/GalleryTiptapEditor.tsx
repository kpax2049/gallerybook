import {
  useEditor,
  EditorContent,
  FloatingMenu,
  BubbleMenu,
  JSONContent,
  Content,
} from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Dropcursor from '@tiptap/extension-dropcursor';
import Image from '@tiptap/extension-image';
// import { Image } from 'reactjs-tiptap-editor/extension-bundle';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
// import ImageResize from 'tiptap-extension-resize-image';
import { Dispatch, SetStateAction, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import { createGallery } from '@/api/gallery';
import StarterKit from '@tiptap/starter-kit';
// import { Toolbar } from './toolbar/Toolbar';
import { MeasuredContainer } from '@/components/minimal-tiptap/components/measured-container';
import { cn } from '@/lib/utils';

import { LinkBubbleMenu } from '@/components/minimal-tiptap/components/bubble-menu/link-bubble-menu';
import useMinimalTiptapEditor from '@/components/minimal-tiptap/hooks/use-minimal-tiptap';
import { Toolbar } from './toolbar/Toolbar';
import { Editor } from './editor/Editor';
// import { Toolbar } from '@/components/minimal-tiptap';

// define your extension array
const extensions = [
  StarterKit,
  //   Document,
  //   Paragraph,
  //   Text,
  Image,

  //   Image.configure({
  //     allowBase64: true,
  //   }),
  //   ImageResize,
  //   Dropcursor,
];

const GalleryTiptapEditor = () => {
  const [content, setContent] = useState<JSONContent>({});
  const [value, setValue] = useState<Content>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSave = (
    data: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    setLoading(true);

    createGallery({
      title: data.title,
      description: data.description,
      content: JSON.stringify(editor?.getJSON()),
      thumbnail: data.thumbnail,
    })
      .then(() => {
        setLoading(false);
        setOpen(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  //   const editor = useEditor({
  //     editorProps: {
  //       attributes: {
  //         class: 'focus:outline-none border border-[#C7C7C7]',
  //       },
  //     },
  //     extensions,
  //     // content,
  //     onUpdate({ editor }) {
  //       console.info('onUpdate', editor.getJSON());
  //       setContent(editor.getJSON());
  //     },
  //   });

  //   const editor2 = useMinimalTiptapEditor({
  //     value: value,
  //     onUpdate: setValue,
  //   });

  //   if (!editor2) {
  //     return null;
  //   }

  //   if (!editor) {
  //     return null;
  //   }

  return (
    <>
      <GallerySaveDialog onSubmit={onSave} content={content} />
      <div className="h-[600px] container flex flex-col h-screen mx-auto p-5 justify-center">
        {/* <Toolbar /> */}
        <div className={'h-full w-full'}>
          {/* <EditorContent
            editor={editor}
            // content={content}
            // onChange={onChangeContent}
          /> */}
          {/* <FloatingMenu editor={editor}>This is the floating menu</FloatingMenu>
          <BubbleMenu editor={editor}>This is the bubble menu</BubbleMenu> */}
        </div>
      </div>
      <MeasuredContainer
        as="div"
        name="editor"
        // ref={ref}
        className={cn(
          'flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-sm focus-within:border-primary'
        )}
      >
        <Toolbar />
        {/* <EditorContent
          editor={editor2}
          className={cn('minimal-tiptap-editor', 'h-full w-full p-5')}
        /> */}
        <Editor initialContent="" />
        {/* <EditorContent
          editor={editor}
          // content={content}
          // onChange={onChangeContent}
        /> */}
        {/* <LinkBubbleMenu editor={editor2} /> */}
      </MeasuredContainer>
    </>
  );
};

export default GalleryTiptapEditor;
