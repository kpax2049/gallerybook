import { Dispatch, SetStateAction, useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useMediaQuery from '@/hooks/useMediaQuery';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { Content } from '@tiptap/react';

export interface FormDataProps {
  title: string;
  description: string;
  thumbnail: string;
}

interface GallerySaveDialogProps {
  content: Content;
  onSubmit: (
    formData: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
}

export function GallerySaveDialog({
  content,
  onSubmit,
}: GallerySaveDialogProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Save</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[465px]">
          <DialogHeader>
            <DialogTitle>Edit Gallery</DialogTitle>
            <DialogDescription>
              Make changes to your gallery here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <GallerySaveForm
            content={content}
            onSubmit={onSubmit}
            setOpen={setOpen}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline">Edit Gallery</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Edit gallery</DrawerTitle>
          <DrawerDescription>
            Make changes to your gallery here. Click save when you're done.
          </DrawerDescription>
        </DrawerHeader>
        <GallerySaveForm
          content={content}
          className="px-4"
          onSubmit={onSubmit}
          setOpen={setOpen}
        />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

interface GallerySaveFormProps {
  content: Content;
  className?: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (
    formData: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
}

function GallerySaveForm({
  content,
  className,
  onSubmit,
  setOpen,
}: GallerySaveFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnail: '',
  });

  function getImages(): string[] {
    console.info('getImages');
    if (!content) return [];
    function traverse(obj) {
      let images: string[] = [];
      for (const prop in obj) {
        if (typeof obj[prop] == 'object' && obj[prop]) {
          if (obj[prop].type === 'image') {
            images.push(obj[prop].attrs?.src);
          }
          images = images.concat(traverse(obj[prop]));
        }
      }
      return images;
    }
    const images = traverse(content);
    return images;
  }
  // getImages();
  const imageArray: string[] = getImages();

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSubmit(formData, setOpen); // Pass the form data to the parent component
  };
  return (
    <form
      onSubmit={handleSubmit}
      className={cn('grid items-start gap-4', className)}
    >
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          type="text"
          name="title"
          id="title"
          // defaultValue=""
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          // onChange={handleInputChange}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          name="description"
          id="description"
          // defaultValue=""
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
              thumbnail: imageArray[0],
            })
          }
        />
        {/* <Input
          type="text"
          name="description"
          id="description"
          // defaultValue=""
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        /> */}
      </div>
      <Label htmlFor="description">Gallery Thumbnail</Label>
      <div className="grid gap-2">
        <Carousel className="w-full max-w-xs flex-col mx-auto">
          <CarouselContent>
            {imageArray.map((_, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardContent className="relative aspect-square w-full basis-1/4 p-0">
                      <img
                        src={imageArray[index]}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious type="button" />
          <CarouselNext type="button" />
        </Carousel>
      </div>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
