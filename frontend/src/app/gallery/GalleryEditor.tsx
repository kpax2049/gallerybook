/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createGallery, Gallery, uploadImagesToS3 } from '@/api/gallery';
// import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Dispatch, SetStateAction, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import RichTextEditor from 'reactjs-tiptap-editor';

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
import { enrich } from '@/lib/galleryUtils';
import { AnyExtension } from '@tiptap/react';
import { fileToBase64 } from '@/lib/fileUtils';
import { extractBase64ImagesFromJSON } from '@/lib/utils';

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

  const onSave = async (
    data: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    setLoading(true);

    try {
      const { valueWithPaths, images } = await extractBase64ImagesFromJSON(
        structuredClone(value)
      );

      if (images && images.length > 0) {
        const s3Map = await uploadImagesToS3(images);

        // Replace placeholder paths with actual S3 URLs
        const replacePaths = (node: any): void => {
          if (
            node.type === 'image' &&
            node.attrs?.src &&
            s3Map[node.attrs.src]
          ) {
            node.attrs.src = s3Map[node.attrs.src];
          }
          if (node.content) node.content.forEach(replacePaths);
        };
        replacePaths(valueWithPaths);
      }

      createGallery({
        title: data.title,
        description: data.description,
        content: JSON.stringify(valueWithPaths),
        thumbnail: data.thumbnail,
      })
        .then((data: Gallery) => {
          setLoading(false);
          setOpen(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error('Error saving gallery:', err);
      alert('Failed to save gallery: ' + (err as Error).message);
    }
  };

  const onChangeContent = (val: any) => {
    setValue(val);
  };

  const SaveButton = enrich(() => (
    <GallerySaveDialog onSubmit={onSave} content={value} />
  ));

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <div
        className={'h-full w-full ' + (!showBubbleMenu && 'bubble-menu-hidden')}
      >
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
      </div>
      {/* <MinimalTiptapEditor
        value={value}
        onChange={setValue}
        className="h-full w-full"
        editorContentClassName="p-5"
        output="json"
        placeholder="Enter your description..."
        autofocus={true}
        editable={true}
        editorClassName="focus:outline-none"
        customComponent={
          <GallerySaveDialog onSubmit={onSave} content={value} />
        }
      /> */}
    </div>
  );
}
