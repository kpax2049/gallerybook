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

export interface FormDataProps {
  title: string;
  description: string;
}

interface GallerySaveDialogProps {
  onSubmit: (
    formData: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
}

export function GallerySaveDialog({ onSubmit }: GallerySaveDialogProps) {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Save</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Gallery</DialogTitle>
            <DialogDescription>
              Make changes to your gallery here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <GallerySaveForm onSubmit={onSubmit} setOpen={setOpen} />
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
  className?: string;
  setOpen: Dispatch<SetStateAction<boolean>>;
  onSubmit: (
    formData: FormDataProps,
    setOpen: Dispatch<SetStateAction<boolean>>
  ) => void;
}

function GallerySaveForm({
  className,
  onSubmit,
  setOpen,
}: GallerySaveFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

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
        <Input
          type="text"
          name="description"
          id="description"
          // defaultValue=""
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />
      </div>
      <Button type="submit">Save changes</Button>
    </form>
  );
}
