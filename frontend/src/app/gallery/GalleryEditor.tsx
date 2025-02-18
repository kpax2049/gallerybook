import { createGallery } from '@/api/gallery';
import { MinimalTiptapEditor } from '@/components/minimal-tiptap';
import { Button } from '@/components/ui/button';
import { Content } from '@tiptap/react';
import { useState } from 'react';
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

  const onSave = () => {
    console.info('saving content ', value);
    setLoading(true);
    createGallery({
      title: 'Title',
      description: 'Description',
      content: value,
    })
      .then((response) => {
        console.info('response ', response);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };
  console.info(value);
  const SaveButtton = (): React.ReactNode => {
    return (
      <Button
        type="submit"
        className="w-full"
        loading={loading}
        onClick={onSave}
      >
        {loading ? 'Saving...' : 'Save'}
      </Button>
    );
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
        customComponent={SaveButtton()}
      />
    </div>
  );
}
