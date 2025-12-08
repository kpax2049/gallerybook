/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createDraftGallery,
  createGallery,
  deleteGalleryImages,
  editGallery,
  fetchPresignedUrls,
  Gallery,
  getGallery,
  uploadFilesToS3,
} from '@/api/gallery';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import RichTextEditor, { useEditorState } from '@/lib/tiptapEditorShim';
// import { Image } from '@tiptap/extension-image';
import { Image } from 'reactjs-tiptap-editor/image';
import 'react-image-crop/dist/ReactCrop.css';
// Import CSS
import 'reactjs-tiptap-editor/style.css';
import { BaseKit } from 'reactjs-tiptap-editor/base-kit';
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
import { Skeleton } from '@/components/ui/skeleton';
import { AnyExtension } from '@tiptap/react';
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

const extensions: AnyExtension[] = [
  BaseKit.configure(
    {
      // Show placeholder
      placeholder: {
        showOnlyCurrent: true,
      },
      // Character count
      characterCount: false,
    } as any
  ),
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
] as unknown as AnyExtension[];

type GalleryEditorProps = {
  mode?: GalleryEditorMode;
  galleryId?: number;
};

export function GalleryEditor({ mode = 'create', galleryId }: GalleryEditorProps) {
  const params = useParams();
  const resolvedGalleryId = useMemo(() => {
    if (galleryId) return galleryId;
    if (params.galleryId) return Number(params.galleryId);
    return undefined;
  }, [galleryId, params.galleryId]);
  const isEdit = mode === 'edit' || !!resolvedGalleryId;

  const [gallery, setGallery] = useState<Gallery>();
  const [value, setValue] = useState<any>('');
  const [originalValue, setOriginalValue] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(false);
  const isDarkMode = useTheme();
  const currentUser = useUserStore((state) => state.user);
  const { editor, editorRef, isReady } = useEditorState();
  const [open, setOpen] = useState(false);
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Load existing gallery when in edit mode
  useEffect(() => {
    if (!isEdit || !resolvedGalleryId) return;
    setLoading(true);
    getGallery(resolvedGalleryId, 'edit').then((data) => {
      setGallery(data);
      if (data?.content) {
        setOriginalValue(data.content);
        const normalizedContent = normalizeAttrs(data.content);
        setValue(normalizedContent);
      }
      setLoading(false);
    });
  }, [isEdit, resolvedGalleryId]);

  const saveNewGallery = async (data: FormDataProps) => {
    if (!currentUser || !data || submitting) return;
    setLoading(true);
    setSubmitting(true);

    try {
      const response = await createDraftGallery({
        title: data.title,
        description: data.description,
        tags: data.tags,
      });

      const draftId = response.id;
      const { imageFiles, paths, updatedJson } = await extractBase64ImagesFromJson(
        value,
        currentUser.id,
        draftId
      );

      if (imageFiles.length === 0) {
        await createGallery({ content: updatedJson }, draftId);
        setLoading(false);
        setOpen(false);
        setSubmitting(false);
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
      setLoading(false);
      setOpen(false);
    } catch (error) {
      console.error('Failed to save gallery:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const saveExistingGallery = async (data: FormDataProps) => {
    if (!currentUser || !resolvedGalleryId) return;
    setLoading(true);
    setSubmitting(true);

    const handleDeletedImages = (updatedJson: any) => {
      const oldKeys = extractImageKeysFromJSON(originalValue);
      const newKeys = extractImageKeysFromJSON(updatedJson);
      const deletedKeys = [...oldKeys].filter((key) => !newKeys.has(key));
      if (deletedKeys.length > 0) {
        deleteGalleryImages(deletedKeys, resolvedGalleryId);
      }
    };

    const updateGalleryMeta = (updatedJson: any) => {
      const newPaths: string[] = Array.from(extractImageKeysFromJSON(updatedJson));
      const { index } = useThumbStore.getState();
      const thumbnailUrl =
        newPaths[index] ??
        newPaths[0] ?? // fallback to first image if needed
        null;
      editGallery(
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
      const { imageFiles, paths, updatedJson } = await extractBase64ImagesFromJson(
        value,
        currentUser.id,
        resolvedGalleryId
      );

      if (imageFiles.length === 0) {
        normalizeImageSrcsToS3Keys(updatedJson);
        updateGalleryMeta(updatedJson);
        createGallery(updatedJson, resolvedGalleryId)
          .then((result: any) => {
            if (result.success) {
              handleDeletedImages(updatedJson);
              setOpen(false);
              setOriginalValue(updatedJson);
            }
          })
          .finally(() => {
            setLoading(false);
            setSubmitting(false);
          });
        return;
      }

      const { presignedUrls } = await fetchPresignedUrls(resolvedGalleryId, paths);
      await uploadFilesToS3(imageFiles, presignedUrls, paths);
      normalizeImageSrcsToS3Keys(updatedJson);
      updateGalleryMeta(updatedJson);

      createGallery(updatedJson, resolvedGalleryId)
        .then((result: any) => {
          if (result.success) {
            handleDeletedImages(updatedJson);
            setOpen(false);
            setOriginalValue(updatedJson);
          }
        })
        .finally(() => {
          setLoading(false);
          setSubmitting(false);
        });
    } catch (error) {
      console.error('Failed to save gallery:', error);
      setLoading(false);
      setSubmitting(false);
      throw error;
    }
  };

  const onSubmit = isEdit ? saveExistingGallery : saveNewGallery;

  const onChangeContent = (val: any) => {
    setValue(val);
  };

  const handleSaveClick = () => {
    if (!editor) return;
    const json = editor.getJSON();
    const html = editor.getHTML();
    const text = editor.getText();
    const images = extractImagesFromPM(json);
    setDialogData({ html, json, text, images });
    setOpen(true);
  };

  const handleEditSaveClick = () => {
    // In edit mode we already hold the JSON string; just open the dialog
    setOpen(true);
  };

  const initialFormData = useMemo(() => {
    if (!isEdit || !gallery) return {};
    const images = Array.from(
      extractImageKeysFromJSON(value || gallery.content || {})
    );
    const thumbIdx = gallery.thumbnail
      ? images.indexOf(gallery.thumbnail)
      : 0;
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

  const EditorSkeleton = () => {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted" />
      </div>
    );
  };

  const renderToolbar = {
    render: (
      _props: any,
      _items: any,
      dom: any,
      containerDom: any
    ) =>
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
            onClick={isEdit ? handleEditSaveClick : handleSaveClick}
            disabled={!isReady}
          >
            Save
          </Button>
        </div>
      ),
  };

  const showEditor =
    !isEdit || (isEdit && !loading && value && resolvedGalleryId !== undefined);

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <div
        className={'h-full w-full ' + (!showBubbleMenu && 'bubble-menu-hidden')}
      >
        {showEditor ? (
          <RichTextEditor
            ref={editorRef}
            toolbar={renderToolbar}
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
