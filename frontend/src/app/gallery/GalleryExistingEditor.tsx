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
import RichTextEditor from 'reactjs-tiptap-editor';
import { Image } from 'reactjs-tiptap-editor/image';
// import { Image } from '@tiptap/extension-image';
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
import { enrich } from '@/lib/galleryUtils';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { AnyExtension } from '@tiptap/react';
import { fileToBase64 } from '@/lib/fileUtils';
import {
  extractBase64ImagesFromJson,
  extractImageKeysFromJSON,
  normalizeAttrs,
} from '@/lib/utils';
import { useUserStore } from '@/stores/userStore';

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
    // upload: (files: File) => {
    //   return new Promise((resolve) => {
    //     setTimeout(() => {
    //       // resolve(URL.createObjectURL(files));
    //       resolve(fileToBase64(files));
    //     }, 500);
    //   });
    // },
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

export function GalleryExistingEditor() {
  const [value, setValue] = useState<any>('');
  const [originalValue, setOriginalValue] = useState<any>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(false);
  const isDarkMode = useTheme();
  const { galleryId } = useParams();
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    setLoading(true);
    if (galleryId) {
      getGallery(galleryId, 'edit').then((data) => {
        if (data.content) {
          setOriginalValue(data.content);
          const normalizedContent = normalizeAttrs(data.content);
          setValue(normalizedContent);
        }
        setLoading(false);
      });
    }
  }, []);

  const onSave = async (
    data: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    if (!currentUser) return;
    setLoading(true);
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
        createGallery({ content: updatedJson }, Number(galleryId))
          .then((data: Gallery) => {
            setLoading(false);
            setOpen(false);
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

      // Step 5: Save gallery content
      createGallery(updatedJson, Number(galleryId))
        .then((data: Gallery) => {
          // eslint-disable-next-line no-debugger
          debugger;
          const oldKeys = extractImageKeysFromJSON(originalValue);
          const newKeys = extractImageKeysFromJSON(updatedJson);

          // Difference: in old but not in new
          const deletedKeys = [...oldKeys].filter((key) => !newKeys.has(key));
          if (deletedKeys.length > 0) {
            // eslint-disable-next-line no-debugger
            debugger;
            deleteGalleryImages(deletedKeys, Number(galleryId));
          }
          setLoading(false);
          setOpen(false);
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

  const SaveButton = enrich(() => (
    <GallerySaveDialog onSubmit={onSave} content={value} />
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
              render: (props, toolbarItems, dom, containerDom) => {
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
