import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react';

import { cn, extractImagesFromPM } from '@/lib/utils';
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
import { Content } from '@tiptap/react';
import { ThumbnailCarousel } from './ThumbnailCarousel';
import { TagField } from '@/components/ui/tag-field';

export interface FormDataProps {
  title: string;
  description: string;
  thumbnailIndex: number;
  tags: string[];
}

interface GallerySaveDialogProps {
  content: Content;
  onSubmit: (
    formData: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
  initial?: Partial<FormDataProps>;
}

export function GallerySaveDialog({
  content,
  onSubmit,
  initial,
}: GallerySaveDialogProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');
  console.info(initial);
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
            initial={initial}
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
          initial={initial}
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
  initial?: Partial<FormDataProps>;
}

function GallerySaveForm({
  content,
  className,
  onSubmit,
  setOpen,
  initial,
}: GallerySaveFormProps) {
  const [formData, setFormData] = useState<FormDataProps>({
    title: '',
    description: '',
    thumbnailIndex: 0,
    tags: [],
  });

  // When editing, hydrate state from initial once data is available/changes
  useEffect(() => {
    if (!initial) return;
    setFormData((prev) => ({
      title: initial.title ?? prev.title,
      description: initial.description ?? prev.description,
      thumbnailIndex: initial.thumbnailIndex ?? prev.thumbnailIndex,
      tags: initial.tags ?? prev.tags,
    }));
    // Depend on individual fields to avoid re-running on new object identity
  }, [
    initial?.title,
    initial?.description,
    initial?.thumbnailIndex,
    initial?.tags,
  ]);

  // Only recompute when `content` changes
  const imageArray = useMemo(() => {
    console.info('getImages (memo)');
    return extractImagesFromPM(content);
  }, [content]);

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    onSubmit(formData, setOpen);
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
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          name="description"
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({
              ...formData,
              description: e.target.value,
            })
          }
        />
      </div>
      <Label htmlFor="description">Gallery Thumbnail</Label>

      <div className="grid gap-2">
        <ThumbnailCarousel images={imageArray} />
      </div>
      <TagField
        value={formData.tags}
        onChange={(newTags) =>
          setFormData({
            ...formData,
            tags: newTags,
          })
        }
      />
      <Button type="submit">Save changes</Button>
    </form>
  );
}
