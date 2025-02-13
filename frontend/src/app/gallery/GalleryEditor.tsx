import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CirclePlus } from 'lucide-react';
import { ImagePlus } from 'lucide-react';
import { MessageSquarePlus } from 'lucide-react';
import { LetterText } from 'lucide-react';
// interface ItemProps {

// }
const NewGalleryMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="exLgIcon">
          <CirclePlus
            className="w-128 h-128"
            style={{ width: '100px', height: '100px' }}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => {}}>
          <LetterText />
          Caption
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {}}>
          <ImagePlus />
          Picture
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => {}}>
          <MessageSquarePlus />
          Paragraph
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function GalleryEditor() {
  return (
    <div className="container mx-auto py-10 flex justify-center">
      <NewGalleryMenu />
    </div>
  );
}
