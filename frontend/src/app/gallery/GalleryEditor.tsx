/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createDraftGallery,
  createGallery,
  deleteGallery,
  deleteGalleryImages,
  editGallery,
  fetchPresignedUrls,
  Gallery,
  getGallery,
  uploadFilesToS3,
} from '@/api/gallery';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import 'react-image-crop/dist/ReactCrop.css';
import 'reactjs-tiptap-editor/style.css';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import { Bold, RichTextBold } from 'reactjs-tiptap-editor/bold';
import {
  BulletList,
  RichTextBulletList,
} from 'reactjs-tiptap-editor/bulletlist';
import { Column, RichTextColumn } from 'reactjs-tiptap-editor/column';
import { Color, RichTextColor } from 'reactjs-tiptap-editor/color';
import { Emoji, RichTextEmoji } from 'reactjs-tiptap-editor/emoji';
import {
  FontFamily,
  RichTextFontFamily,
} from 'reactjs-tiptap-editor/fontfamily';
import { FontSize, RichTextFontSize } from 'reactjs-tiptap-editor/fontsize';
import { Heading, RichTextHeading } from 'reactjs-tiptap-editor/heading';
import { Highlight, RichTextHighlight } from 'reactjs-tiptap-editor/highlight';
import {
  HorizontalRule,
  RichTextHorizontalRule,
} from 'reactjs-tiptap-editor/horizontalrule';
import { Image, RichTextImage } from 'reactjs-tiptap-editor/image';
import { Indent, RichTextIndent } from 'reactjs-tiptap-editor/indent';
import { Italic, RichTextItalic } from 'reactjs-tiptap-editor/italic';
import {
  OrderedList,
  RichTextOrderedList,
} from 'reactjs-tiptap-editor/orderedlist';
import { Strike, RichTextStrike } from 'reactjs-tiptap-editor/strike';
import { Table, RichTextTable } from 'reactjs-tiptap-editor/table';
import { TextAlign, RichTextAlign } from 'reactjs-tiptap-editor/textalign';
import {
  TextUnderline,
  RichTextUnderline,
} from 'reactjs-tiptap-editor/textunderline';
import { EditorContent, AnyExtension, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Skeleton } from '@/components/ui/skeleton';
import { fileToBase64 } from '@/lib/fileUtils';
import {
  extractBase64ImagesFromJson,
  extractImageKeysFromJSON,
  extractImagesFromPM,
  Img,
  normalizeAttrs,
  normalizeImageSrcsToS3Keys,
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

type GalleryEditorMode = 'create' | 'edit';

type GalleryEditorProps = {
  mode?: GalleryEditorMode;
  galleryId?: number;
};

export function GalleryEditor({
  mode = 'create',
  galleryId,
}: GalleryEditorProps) {
  const params = useParams();
  const resolvedGalleryId = useMemo(() => {
    if (galleryId !== undefined) return galleryId;
    if (params.galleryId) return Number(params.galleryId);
    return undefined;
  }, [galleryId, params.galleryId]);
  const isEdit = mode === 'edit' || resolvedGalleryId !== undefined;

  const [gallery, setGallery] = useState<Gallery>();
  const [value, setValue] = useState<any>('');
  const [originalValue, setOriginalValue] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const currentUser = useUserStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const extensions = useMemo<AnyExtension[]>(
    () => [
      StarterKit.configure({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        bulletList: false,
        orderedList: false,
        heading: false,
        horizontalRule: false,
      }),
      TextStyle,
      Placeholder.configure({
        placeholder: 'Share your gallery story...',
      }),
      Bold,
      Italic,
      TextUnderline,
      Strike,
      Color,
      Highlight,
      FontSize,
      FontFamily,
      BulletList,
      OrderedList,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Indent,
      HorizontalRule,
      Table,
      Column,
      Emoji,
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
      }),
      Image.configure({
        resourceImage: 'upload',
        upload: async (file: File) => fileToBase64(file),
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value,
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setValue(json);
    },
  });

  // Load existing gallery when in edit mode
  useEffect(() => {
    if (!isEdit || !resolvedGalleryId) return;
    setLoading(true);
    getGallery(resolvedGalleryId, 'edit')
      .then((data) => {
        setGallery(data);
        if (data?.content) {
          setOriginalValue(data.content);
          const normalizedContent = normalizeAttrs(data.content);
          setValue(normalizedContent);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [isEdit, resolvedGalleryId]);

  useEffect(() => {
    if (!editor || !value) return;
    try {
      const current = editor.getJSON();
      const incoming = value || '';
      if (JSON.stringify(current) !== JSON.stringify(incoming)) {
        if (incoming) {
          editor.commands.setContent(incoming);
        } else {
          editor.commands.clearContent(true);
        }
      }
    } catch (err) {
      console.error('Failed to sync editor content', err);
    }
  }, [editor, value]);

  const saveNewGallery = async (data: FormDataProps) => {
    if (!currentUser || !data || submitting) return;
    setLoading(true);
    setSubmitting(true);
    let draftId: number | undefined;
    let uploadedPaths: string[] = [];

    try {
      const response = await createDraftGallery({
        title: data.title,
        description: data.description,
        tags: data.tags,
      });

      draftId = response.id;
      const { imageFiles, paths, updatedJson } =
        await extractBase64ImagesFromJson(value, currentUser.id, draftId);
      uploadedPaths = paths;

      if (imageFiles.length === 0) {
        await createGallery(updatedJson, draftId);
        setOpen(false);
        return;
      }

      const { presignedUrls } = await fetchPresignedUrls(draftId, paths);
      await uploadFilesToS3(imageFiles, presignedUrls, paths);

      const { index } = useThumbStore.getState();
      const thumbnailUrl =
        paths[index] ??
        paths[0] ?? // fallback to first image if needed
        null;

      await editGallery({ thumbnail: thumbnailUrl }, draftId);
      await createGallery(updatedJson, draftId);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save gallery:', error);
      if (draftId !== undefined) {
        if (uploadedPaths.length > 0) {
          try {
            await deleteGalleryImages(uploadedPaths, draftId);
          } catch (cleanupError) {
            console.error(
              'Failed to clean up draft gallery images:',
              cleanupError
            );
          }
        }

        try {
          await deleteGallery(draftId);
        } catch (cleanupError) {
          console.error('Failed to clean up draft gallery:', cleanupError);
        }
      }
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const saveExistingGallery = async (data: FormDataProps) => {
    if (!currentUser || !resolvedGalleryId) return;
    setLoading(true);
    setSubmitting(true);

    const handleDeletedImages = async (updatedJson: any) => {
      const oldKeys = extractImageKeysFromJSON(originalValue);
      const newKeys = extractImageKeysFromJSON(updatedJson);
      const deletedKeys = [...oldKeys].filter((key) => !newKeys.has(key));
      if (deletedKeys.length > 0) {
        await deleteGalleryImages(deletedKeys, resolvedGalleryId);
      }
    };

    const updateGalleryMeta = async (updatedJson: any) => {
      const newPaths: string[] = Array.from(
        extractImageKeysFromJSON(updatedJson)
      );
      const { index } = useThumbStore.getState();
      const thumbnailUrl =
        newPaths[index] ??
        newPaths[0] ?? // fallback to first image if needed
        null;
      await editGallery(
        {
          thumbnail: thumbnailUrl,
          title: data.title,
          description: data.description,
          tags: data.tags,
        },
        resolvedGalleryId
      );
    };

    try {
      const { imageFiles, paths, updatedJson } =
        await extractBase64ImagesFromJson(
          value,
          currentUser.id,
          resolvedGalleryId
        );

      if (imageFiles.length === 0) {
        normalizeImageSrcsToS3Keys(updatedJson);
        await updateGalleryMeta(updatedJson);
        const result: any = await createGallery(updatedJson, resolvedGalleryId);
        if (result.success) {
          await handleDeletedImages(updatedJson);
          setOpen(false);
          setOriginalValue(updatedJson);
        }
        return;
      }

      const { presignedUrls } = await fetchPresignedUrls(
        resolvedGalleryId,
        paths
      );
      await uploadFilesToS3(imageFiles, presignedUrls, paths);
      normalizeImageSrcsToS3Keys(updatedJson);
      await updateGalleryMeta(updatedJson);
      const result: any = await createGallery(updatedJson, resolvedGalleryId);
      if (result.success) {
        await handleDeletedImages(updatedJson);
        setOpen(false);
        setOriginalValue(updatedJson);
      }
    } catch (error) {
      console.error('Failed to save gallery:', error);
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const onSubmit = isEdit ? saveExistingGallery : saveNewGallery;

  const handleSaveClick = useCallback(() => {
    if (!editor) return;
    const json = editor.getJSON();
    const html = editor.getHTML();
    const text = editor.getText();
    const images = extractImagesFromPM(json);
    setDialogData({ html, json, text, images });
    setOpen(true);
  }, [editor]);

  const handleEditSaveClick = useCallback(() => {
    setOpen(true);
  }, []);

  const initialFormData = useMemo(() => {
    if (!isEdit || !gallery) return {};
    const images = Array.from(
      extractImageKeysFromJSON(value || gallery.content || {})
    );
    const thumbIdx = gallery.thumbnail ? images.indexOf(gallery.thumbnail) : 0;
    return {
      title: gallery.title ?? '',
      description: gallery.description ?? '',
      tags: (gallery as any)?.tags ?? [],
      thumbnailIndex: thumbIdx >= 0 ? thumbIdx : 0,
    };
  }, [isEdit, gallery, value]);

  const handleOpenChange = (v: boolean) => {
    if (submitting) return;
    setOpen(v);
    if (!v) setDialogData(null);
  };

  const handleImageUpload = useCallback(
    async (files: FileList | null) => {
      if (!editor || !files?.length) return;
      const file = files[0];
      const src = await fileToBase64(file);
      editor.chain().focus().setImage({ src }).run();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [editor]
  );

  const EditorSkeleton = () => {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted" />
      </div>
    );
  };

  const editorReady = !!editor?.extensionManager;

  const toolbar = useMemo(() => {
    if (!editorReady) return null;
    return (
      <div className="mb-4 richtext-flex richtext-flex-wrap richtext-items-center richtext-gap-2 richtext-rounded-md richtext-border richtext-bg-popover richtext-p-2">
        <RichTextHeading />
        <RichTextBold />
        <RichTextItalic />
        <RichTextUnderline />
        <RichTextStrike />
        <RichTextColor />
        <RichTextHighlight />
        <RichTextFontFamily />
        <RichTextFontSize />
        <RichTextAlign />
        <RichTextBulletList />
        <RichTextOrderedList />
        <RichTextIndent />
        <RichTextColumn />
        <RichTextTable />
        <RichTextHorizontalRule />
        <RichTextImage />
        <RichTextEmoji />
        <span className="richtext-flex-1" />
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={isEdit ? handleEditSaveClick : handleSaveClick}
        >
          Save
        </Button>
      </div>
    );
  }, [editorReady, handleEditSaveClick, handleSaveClick, isEdit]);

  const showEditor =
    editorReady &&
    (!isEdit || (isEdit && !loading && resolvedGalleryId !== undefined));

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <div className="h-full w-full">
        {showEditor ? (
          <RichTextProvider editor={editor}>
            {toolbar}
            <EditorContent
              className="min-h-[380px] rounded-lg border bg-card p-4 prose max-w-none focus:outline-none"
              editor={editor}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={(e) => handleImageUpload(e.target.files)}
            />
          </RichTextProvider>
        ) : (
          <EditorSkeleton />
        )}
      </div>
      {((isEdit && value) || (!isEdit && dialogData)) && (
        <GallerySaveDialog
          onSubmit={onSubmit}
          data={isEdit ? value : dialogData}
          open={open}
          onOpenChange={handleOpenChange}
          submitting={submitting}
          initial={initialFormData}
        />
      )}
    </div>
  );
}
