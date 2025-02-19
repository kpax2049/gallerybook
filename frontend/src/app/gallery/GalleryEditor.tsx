import { createGallery } from '@/api/gallery';
import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Content } from '@tiptap/react';
import { Dispatch, SetStateAction, useState } from 'react';
import { FormDataProps, GallerySaveDialog } from './galleryDialog/SaveDialog';
// interface ItemProps {

// }
// const NewGalleryMenu = () => {
//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button variant="ghost" size="exLgIcon">
//           <CirclePlus
//             className="w-128 h-128"
//             style={{ width: '100px', height: '100px' }}
//           />
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         <DropdownMenuItem onClick={() => {}}>
//           <LetterText />
//           Caption
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => {}}>
//           <ImagePlus />
//           Picture
//         </DropdownMenuItem>

//         <DropdownMenuItem onClick={() => {}}>
//           <MessageSquarePlus />
//           Paragraph
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   );
// };

export function GalleryEditor() {
  const [value, setValue] = useState<Content>('');
  const [loading, setLoading] = useState<boolean>(false);

  const onSave = (
    data: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => {
    console.info('saving content ', value);
    setLoading(true);
    createGallery({
      title: data.title,
      description: data.description,
      content: value,
    })
      .then((response) => {
        console.info('response ', response);
        setLoading(false);
        setOpen(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <div className="container mx-auto p-5 flex justify-center">
      {/* <NewGalleryMenu /> */}
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
        customComponent={<GallerySaveDialog onSubmit={onSave} />}
      />
    </div>
  );
}
