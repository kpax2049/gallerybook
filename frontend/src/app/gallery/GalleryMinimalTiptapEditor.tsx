/* eslint-disable @typescript-eslint/no-explicit-any */
import { createGallery } from '@/api/gallery';
import { Dispatch, SetStateAction, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Content } from '@tiptap/react';

export function GalleryMinimalTiptapEditor() {
  const [value, setValue] = useState<Content>('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState<boolean>(false);

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

  //   const onChangeContent = (val: any) => {
  //     setValue(val);
  //   };

  //   const SaveButton = enrich(() => (
  //     <GallerySaveDialog onSubmit={onSave} content={value} />
  //   ));

  return (
    <div className="container mx-auto p-5 flex justify-center">
      <MinimalTiptapEditor
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
      />
    </div>
  );
}
