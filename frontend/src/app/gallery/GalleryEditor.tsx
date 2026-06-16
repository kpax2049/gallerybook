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
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import 'react-image-crop/dist/ReactCrop.css';
import 'reactjs-tiptap-editor/style.css';
import './GalleryEditor.css';
import { RichTextProvider } from 'reactjs-tiptap-editor';
import { themeActions } from 'reactjs-tiptap-editor/theme';
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
import { cn } from '@/lib/utils';
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
import { useTheme as useAppTheme } from '@/components/theme-provider';
import {
  ImageUploadButton,
  ImageUploadDialog,
} from '@/components/file-upload-06';
import {
  readImageDimensions,
  StoryImage,
  StoryLink,
  StoryParagraph,
} from './galleryStoryExtensions';

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

const editorSurfaceStyle: CSSProperties = {
  backgroundColor: 'var(--gb-panel)',
  borderColor: 'var(--gb-border)',
  color: 'var(--gb-ink)',
};

export function GalleryEditor({
  mode = 'create',
  galleryId,
}: GalleryEditorProps) {
  const params = useParams();
  const navigate = useNavigate();
  const { theme } = useAppTheme();
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
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [showSelectionBubble, setShowSelectionBubble] = useState(false);
  const editorRef = useRef<any>(null);

  const extensions = useMemo<AnyExtension[]>(
    () => [
      StarterKit.configure({
        paragraph: false,
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        bulletList: false,
        orderedList: false,
        heading: false,
        horizontalRule: false,
        link: false,
      }),
      StoryParagraph,
      StoryImage,
      StoryLink,
      TextStyle,
      Placeholder.configure({
        placeholder: ({ node }) =>
          node.type.name === 'paragraph'
            ? 'Type / for a block, or drag a photo here'
            : 'Share your gallery story...',
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
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: value,
    editorProps: {
      attributes: {
        class: 'gallery-editor-prosemirror',
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter(
          (file) => file.type.startsWith('image/')
        );
        if (!files.length) return false;
        event.preventDefault();
        void handleInsertImages(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter(
          (file) => file.type.startsWith('image/')
        );
        if (!files.length) return false;
        event.preventDefault();
        void handleInsertImages(files);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON();
      setValue(json);
    },
    onSelectionUpdate: ({ editor }) => {
      setShowSelectionBubble(!editor.state.selection.empty);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    const getResolvedTheme = () => {
      if (theme !== 'system') return theme;
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    };

    const syncEditorTheme = () => {
      themeActions.setTheme(getResolvedTheme());
    };

    syncEditorTheme();

    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', syncEditorTheme);

    return () => {
      mediaQuery.removeEventListener('change', syncEditorTheme);
    };
  }, [theme]);

  // Load existing gallery when in edit mode
  useEffect(() => {
    if (!isEdit || !resolvedGalleryId) return;
    setLoading(true);
    getGallery(resolvedGalleryId, 'edit')
      .then((data) => {
        setGallery(data);
        setTitleDraft(data.title ?? '');
        setDescriptionDraft(data.description ?? '');
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
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      if (cancelled) return;
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
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
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

  const handleCancelClick = useCallback(() => {
    if (submitting) return;

    if (isEdit && resolvedGalleryId !== undefined) {
      navigate(`/galleries/${gallery?.slug ?? resolvedGalleryId}`);
      return;
    }

    navigate('/galleries');
  }, [gallery?.slug, isEdit, navigate, resolvedGalleryId, submitting]);

  const initialFormData = useMemo(() => {
    if (!isEdit || !gallery) {
      return {
        title: titleDraft,
        description: descriptionDraft,
      };
    }
    const images = Array.from(
      extractImageKeysFromJSON(value || gallery.content || {})
    );
    const thumbIdx = gallery.thumbnail ? images.indexOf(gallery.thumbnail) : 0;
    return {
      title: titleDraft || gallery.title || '',
      description: descriptionDraft || gallery.description || '',
      tags: (gallery as any)?.tags ?? [],
      thumbnailIndex: thumbIdx >= 0 ? thumbIdx : 0,
    };
  }, [descriptionDraft, isEdit, gallery, titleDraft, value]);

  const handleOpenChange = (v: boolean) => {
    if (submitting) return;
    setOpen(v);
    if (!v) setDialogData(null);
  };

  const handleImageUploadClick = useCallback(() => {
    setImageUploadOpen(true);
  }, []);

  const handleInsertImages = useCallback(
    async (files: File[]) => {
      const activeEditor = editorRef.current;
      if (!activeEditor) return;

      for (const file of files) {
        const src = await fileToBase64(file);
        const dimensions = await readImageDimensions(src);
        activeEditor
          .chain()
          .focus()
          .insertContent({
            type: 'image',
            attrs: {
              src,
              alt: file.name,
              title: file.name,
              align: 'center',
              size: 'measure',
              width: dimensions.width ?? undefined,
              height: dimensions.height ?? undefined,
            },
          })
          .run();
      }
    },
    []
  );

  const EditorSkeleton = () => {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted" />
      </div>
    );
  };

  const editorReady =
    !!editor &&
    !editor.isDestroyed &&
    Array.isArray(editor.extensionManager?.extensions);

  const toolbar = useMemo(() => {
    if (!editorReady) return null;
    return (
      <div
        className="gallery-editor-toolbar richtext-flex richtext-items-center richtext-gap-2 richtext-overflow-x-auto richtext-rounded-none richtext-border-0 richtext-border-b richtext-p-3"
        style={editorSurfaceStyle}
      >
        <span className="gb-serif mr-1 whitespace-nowrap text-base text-[var(--gb-ink)]">
          Gallery Book
        </span>
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
        <ImageUploadButton
          onClick={handleImageUploadClick}
          disabled={submitting}
        />
        <RichTextEmoji />
        <span className="richtext-flex-1" />
        <span className="whitespace-nowrap rounded-full bg-[var(--gb-accent-soft)] px-3 py-1 text-xs font-medium text-[var(--gb-accent)]">
          ✓ Saved
        </span>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCancelClick}
          disabled={submitting}
          className="gb-chip rounded-[11px]"
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          onClick={isEdit ? handleEditSaveClick : handleSaveClick}
          disabled={submitting}
          className="rounded-[11px] bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]/90"
        >
          Save story
        </Button>
      </div>
    );
  }, [
    editorReady,
    handleCancelClick,
    handleEditSaveClick,
    handleImageUploadClick,
    handleSaveClick,
    isEdit,
    submitting,
  ]);

  const showEditor =
    editorReady &&
    (!isEdit || (isEdit && !loading && resolvedGalleryId !== undefined));

  return (
    <div className="gb-page min-h-svh">
      <div className="gallery-editor-shell">
        {showEditor ? (
          <RichTextProvider editor={editor}>
            {toolbar}
            <main className="gb-editor-story-shell">
              <div className="gb-editor-title-block">
                <p className="gb-hand text-[24px] font-semibold text-[var(--gb-hand)]">
                  {isEdit ? 'editing story' : 'new story'} · draft
                </p>
                <input
                  value={titleDraft}
                  onChange={(event) => setTitleDraft(event.target.value)}
                  placeholder="Untitled story"
                  className="gb-editor-title-input"
                  aria-label="Gallery title"
                />
                <textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  placeholder="Add a short story summary..."
                  className="gb-editor-description-input"
                  aria-label="Gallery description"
                  rows={2}
                />
              </div>

              {editor && showSelectionBubble && (
                <div className="gb-bubble-menu gb-bubble-menu-static">
                  <button
                    type="button"
                    className={cn(editor.isActive('bold') && 'is-active')}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                  >
                    B
                  </button>
                  <button
                    type="button"
                    className={cn(editor.isActive('italic') && 'is-active')}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                  >
                    I
                  </button>
                  <button
                    type="button"
                    className={cn(editor.isActive('underline') && 'is-active')}
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                  >
                    U
                  </button>
                  <button
                    type="button"
                    className={cn(editor.isActive('link') && 'is-active')}
                    onClick={() => {
                      const previous = editor.getAttributes('link').href;
                      const href = window.prompt('Link URL', previous || '');
                      if (href === null) return;
                      if (href === '') {
                        editor.chain().focus().unsetLink().run();
                        return;
                      }
                      editor.chain().focus().setLink({ href }).run();
                    }}
                  >
                    Link
                  </button>
                </div>
              )}

              <EditorContent
                className="gallery-editor-content gb-story-editor-content"
                editor={editor}
                style={editorSurfaceStyle}
              />
            </main>
            <ImageUploadDialog
              open={imageUploadOpen}
              onOpenChange={setImageUploadOpen}
              onInsert={handleInsertImages}
            />
          </RichTextProvider>
        ) : (
          <div className="gb-editor-story-shell">
            <EditorSkeleton />
          </div>
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
