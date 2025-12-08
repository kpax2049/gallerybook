/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createGallery,
  deleteGalleryImages,
  editGallery,
  fetchPresignedUrls,
  Gallery,
  getGallery,
  uploadFilesToS3,
} from '@/api/gallery';
// import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import RichTextEditor from '@/lib/tiptapEditorShim';
import { Image } from 'reactjs-tiptap-editor/image';
// import { Image } from '@tiptap/extension-image';
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
import { enrich } from '@/lib/galleryUtils';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AnyExtension } from '@tiptap/react';
import { fileToBase64 } from '@/lib/fileUtils';
import {
  extractBase64ImagesFromJson,
  extractImageKeysFromJSON,
  normalizeAttrs,
  normalizeImageSrcsToS3Keys,
} from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';
import { useThumbStore } from '@/stores/thumbStore';
import { DialogData } from './GalleryEditor';

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

export function GalleryExistingEditor() {
  const [gallery, setGallery] = useState<Gallery>();
  const [value, setValue] = useState<any>('');
  const [originalValue, setOriginalValue] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(false);
  const isDarkMode = useTheme();
  const { galleryId } = useParams();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialogData, setDialogData] = useState<DialogData | null>(null);
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    setLoading(true);
    if (galleryId) {
      getGallery(Number(galleryId), 'edit').then((data) => {
        setGallery(data);
        if (data.content) {
          setOriginalValue(data.content);
          const normalizedContent = normalizeAttrs(data.content);
          setValue(normalizedContent);
        }
        setLoading(false);
      });
    }
  }, []);

  const onSave = async (data: FormDataProps) => {
    if (!currentUser) return;
    setLoading(true);
    // Delete removed images from S3 directly
    function handleDeletedImages(updatedJson: any) {
      const oldKeys = extractImageKeysFromJSON(originalValue);
      const newKeys = extractImageKeysFromJSON(updatedJson);
      const deletedKeys = [...oldKeys].filter((key) => !newKeys.has(key));
      if (deletedKeys.length > 0) {
        deleteGalleryImages(deletedKeys, Number(galleryId));
      }
    }
    function updateGalleryMeta(updatedJson: any) {
      const newPaths: string[] = Array.from(
        extractImageKeysFromJSON(updatedJson)
      );
      // Resolve the thumbnail URL safely by index, with fallbacks
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
        Number(galleryId)
      );
    }
    try {
      // Step 2: Extract base64 images, generate final S3 paths, and update JSON with real paths
      const { imageFiles, paths, updatedJson } =
        await extractBase64ImagesFromJson(
          value,
          currentUser.id,
          Number(galleryId)
        );

      if (imageFiles.length === 0) {
        // No images to upload; save content directly
        normalizeImageSrcsToS3Keys(updatedJson);
        updateGalleryMeta(updatedJson);
        createGallery(updatedJson, Number(galleryId))
          .then((result: any) => {
            if (result.success) {
              handleDeletedImages(updatedJson);
              setLoading(false);
              setOpen(false);
              setOriginalValue(updatedJson);
            }
          })
          .catch(() => {
            setLoading(false);
          });
        return;
      }

      // Step 3: Generate S3 keys and get presigned upload URLs
      const { presignedUrls } = await fetchPresignedUrls(
        Number(galleryId),
        paths
      );

      // Step 4: Upload each image to its presigned S3 URL
      await uploadFilesToS3(imageFiles, presignedUrls, paths);

      // Step 5: Normalize Image sources to S3 Keys only
      normalizeImageSrcsToS3Keys(updatedJson);
      updateGalleryMeta(updatedJson);
      // Step 6: Save gallery content
      createGallery(updatedJson, Number(galleryId))
        .then((result: any) => {
          if (result.success) {
            handleDeletedImages(updatedJson);
            setLoading(false);
            setOpen(false);
            setOriginalValue(updatedJson);
          }
        })
        .catch(() => {
          setLoading(false);
        });
    } catch (error) {
      console.error('Failed to save gallery:', error);
      throw error;
    }
  };

  const onChangeContent = (val: any) => {
    setValue(val);
  };

  const handleOpenChange = (v: boolean) => {
    // If user manually closes during submission, you can ignore or allow
    if (submitting) return;
    setOpen(v);
    if (!v) setDialogData(null);
  };

  const SaveButton = enrich(() => (
    <GallerySaveDialog
      onSubmit={onSave}
      data={value}
      open={open}
      onOpenChange={handleOpenChange}
      submitting={submitting}
    />
  ));

  const EditorSkeleton = () => {
    return (
      <div className="flex flex-col space-y-3">
        <Skeleton className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted" />
      </div>
    );
  };

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <div
        className={'h-full w-full ' + (!showBubbleMenu && 'bubble-menu-hidden')}
      >
        {value && galleryId ? (
          <RichTextEditor
            toolbar={{
              render: (
                props: any,
                toolbarItems: any,
                dom: any,
                containerDom: any
              ) => {
                // Workaround using render function to pass a custom component to
                // an array of toolbar items from the extensions. Making sure it's appeneded to
                // end and updated with latest props on each re-render
                const isSaveBtnExists = (toolbarItem: any) =>
                  toolbarItem.name === 'SaveButton';
                const saveBtn = {
                  button: {
                    component: SaveButton,
                    componentProps: {},
                  },
                  divider: true,
                  spacer: true,
                  name: 'SaveButton',
                  type: 'Custom',
                };
                const saveBtnIdx = toolbarItems.findIndex(isSaveBtnExists);
                if (saveBtnIdx < 0) {
                  toolbarItems.push(saveBtn);
                } else {
                  toolbarItems.splice(saveBtnIdx, 1, saveBtn);
                }

                return containerDom(dom);
              },
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
        ) : (
          <EditorSkeleton />
        )}
      </div>
    </div>
  );
}
