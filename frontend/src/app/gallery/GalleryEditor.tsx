/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createDraftGallery,
  createGallery,
  editGallery,
  fetchPresignedUrls,
  uploadFilesToS3,
} from '@/api/gallery';
import { useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import RichTextEditor, { useEditorState } from 'reactjs-tiptap-editor';
// import { Image } from '@tiptap/extension-image';
import { Image } from 'reactjs-tiptap-editor/image';
import 'react-image-crop/dist/ReactCrop.css';
// Import CSS
import 'reactjs-tiptap-editor/style.css';
import { BaseKit } from 'reactjs-tiptap-editor';
import { Bold } from 'reactjs-tiptap-editor/bold';
import { TextAlign } from 'reactjs-tiptap-editor/textalign';
import { Color } from 'reactjs-tiptap-editor/color';
import { Italic } from 'reactjs-tiptap-editor/italic';
import { FontFamily } from 'reactjs-tiptap-editor/fontfamily';
import { FontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading } from 'reactjs-tiptap-editor/heading';
import { Highlight } from 'reactjs-tiptap-editor/highlight';
import { History } from 'reactjs-tiptap-editor/history';
import { BulletList } from 'reactjs-tiptap-editor/bulletlist';
import { ColumnActionButton } from 'reactjs-tiptap-editor/multicolumn';
import { Emoji } from 'reactjs-tiptap-editor/emoji';
import { HorizontalRule } from 'reactjs-tiptap-editor/horizontalrule';
import { Indent } from 'reactjs-tiptap-editor/indent';
import { OrderedList } from 'reactjs-tiptap-editor/orderedlist';
import { Strike } from 'reactjs-tiptap-editor/strike';
import { Table } from 'reactjs-tiptap-editor/table';
import { TextUnderline } from 'reactjs-tiptap-editor/textunderline';

import { useTheme } from '@/components/theme-provider';
import { AnyExtension } from '@tiptap/react';
import { fileToBase64 } from '@/lib/fileUtils';
import {
  extractBase64ImagesFromJson,
  extractImagesFromPM,
  Img,
} from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useThumbStore } from '@/stores/thumbStore';
import { Button } from '@/components/ui/button';

export type DialogData = {
  html: string;
  json: any;
  text: string;
  images: Img[];
};

const extensions: AnyExtension[] = [
  BaseKit.configure({
    // Show placeholder
    placeholder: {
      showOnlyCurrent: true,
    },

    // Character count
    characterCount: false,
  }),
  History,
  // Import Extensions Here
  Image.configure({
    upload: (files: File) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // resolve(URL.createObjectURL(files));
          resolve(fileToBase64(files));
        }, 500);
      });
    },
  }),
  FontFamily,
  Heading,
  FontSize,
  Bold,
  Italic,
  TextUnderline,
  Strike,
  Color,
  Highlight,
  BulletList,
  OrderedList,
  TextAlign,
  Indent,
  HorizontalRule,
  ColumnActionButton,
  Table,
  Emoji,
];

export function GalleryEditor() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(false);
  const isDarkMode = useTheme();
  const currentUser = useUserStore((state) => state.user);
  const { editor, editorRef, isReady } = useEditorState();
  const [open, setOpen] = useState(false);
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSave = async (
    data: FormDataProps
    // setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    if (!currentUser || !data || submitting) return;
    setLoading(true);
    setSubmitting(true);

    try {
      // Step 1: Create draft gallery and get galleryId
      const response = await createDraftGallery({
        title: data.title,
        description: data.description,
        tags: data.tags,
      });

      const galleryId = response.id;

      // Step 2: Extract base64 images, generate final S3 paths, and update JSON with real paths
      const { imageFiles, paths, updatedJson } =
        await extractBase64ImagesFromJson(value, currentUser.id, galleryId);

      if (imageFiles.length === 0) {
        // No images to upload; save content directly
        createGallery({ content: updatedJson }, galleryId)
          .then((result: any) => {
            if (result.success) {
              setLoading(false);
              setOpen(false);
            }
          })
          .catch(() => {
            setLoading(false);
          })
          .finally(() => {
            setSubmitting(false);
          });
        return;
      }

      // Step 3: Generate S3 keys and get presigned upload URLs
      const { presignedUrls } = await fetchPresignedUrls(galleryId, paths);

      // Step 4: Upload each image to its presigned S3 URL
      await uploadFilesToS3(imageFiles, presignedUrls, paths);
      // Step 5: Resolve the thumbnail URL safely by index, with fallbacks
      const { index } = useThumbStore.getState();
      const thumbnailUrl =
        paths[index] ??
        paths[0] ?? // fallback to first image if needed
        null;
      editGallery(
        {
          thumbnail: thumbnailUrl,
        },
        galleryId
      );
      // Step 6: Save gallery content
      createGallery(updatedJson, galleryId)
        .then((result: any) => {
          if (result.success) {
            setLoading(false);
            setOpen(false);
          }
        })
        .catch(() => {
          setLoading(false);
        })
        .finally(() => {
          setSubmitting(false);
        });
    } catch (error) {
      console.error('Failed to save gallery:', error);
      throw error;
    }
  };

  const onChangeContent = (val: any) => {
    setValue(val);
  };

  const handleSaveClick = () => {
    if (!editor) return;
    // Step 1: synchronous snapshot
    const json = editor.getJSON();
    const html = editor.getHTML();
    const text = editor.getText();

    // Step 2: derive images synchronously from the snapshot
    const images = extractImagesFromPM(json);

    // Step 3: commit all at once and allow Dialog to render
    setDialogData({ html, json, text, images });
    setOpen(true);
  };

  const handleOpenChange = (v: boolean) => {
    // If user manually closes during submission, you can ignore or allow
    if (submitting) return;
    setOpen(v);
    if (!v) setDialogData(null);
  };

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <div
        className={'h-full w-full ' + (!showBubbleMenu && 'bubble-menu-hidden')}
      >
        <RichTextEditor
          ref={editorRef}
          toolbar={{
            render: (_props, _items, dom, containerDom) =>
              containerDom(
                <div
                  className="flex flex-wrap items-center gap-2"
                  style={{ overflow: 'visible' }}
                >
                  {dom}
                  <span className="grow basis-full sm:basis-0" />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveClick}
                    disabled={!isReady}
                  >
                    Save
                  </Button>
                </div>
              ),
          }}
          output="json"
          content={value}
          onChangeContent={onChangeContent}
          extensions={extensions}
          dark={isDarkMode.theme === 'dark'}
          bubbleMenu={{
            floatingMenuConfig: {
              hidden: false,
            },
          }}
          disableBubble={!showBubbleMenu}
          hideBubble={!showBubbleMenu}
        />
      </div>
      {dialogData && (
        <GallerySaveDialog
          onSubmit={onSave}
          data={dialogData}
          open={open}
          onOpenChange={handleOpenChange}
          submitting={submitting}
        />
      )}
    </div>
  );
}
