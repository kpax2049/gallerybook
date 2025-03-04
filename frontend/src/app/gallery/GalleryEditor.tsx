/* eslint-disable @typescript-eslint/no-explicit-any */
import { createGallery } from '@/api/gallery';
// import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Dispatch, SetStateAction, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import RichTextEditor from 'reactjs-tiptap-editor';
import {
  BaseKit,
  Bold,
  Color,
  FontFamily,
  FontSize,
  Heading,
  History,
  Highlight,
  Image,
  Italic,
  TextAlign,
} from 'reactjs-tiptap-editor/extension-bundle';
// Import CSS
import 'reactjs-tiptap-editor/style.css';
import { useTheme } from '@/components/theme-provider';
import { fileToBase64 } from '@/components/minimal-tiptap/utils';
import { enrich } from '@/lib/galleryUtils';

const extensions = [
  BaseKit.configure({
    // Show placeholder
    placeholder: {
      showOnlyCurrent: true,
    },

    // Character count
    characterCount: false,
  }),

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
  Bold,
  Italic,
  TextAlign,
  Color,
  FontFamily,
  FontSize,
  Heading,
  Highlight,
  History,
];

export function GalleryEditor() {
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showBubbleMenu, setShowBubbleMenu] = useState<boolean>(false);
  const isDarkMode = useTheme();

  const onSave = (
    data: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    setLoading(true);

    createGallery({
      title: data.title,
      description: data.description,
      content: JSON.stringify(value),
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
