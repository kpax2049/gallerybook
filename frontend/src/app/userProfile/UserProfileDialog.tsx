import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserProfileEditor,
  UserProfileFormDataProps,
} from './UserProfileEditor';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BadgeCheck } from 'lucide-react';
import { Dispatch, SetStateAction, useState } from 'react';

const onSave = (
  data: UserProfileFormDataProps,
  setOpen: Dispatch<SetStateAction<boolean>>
) => {
  console.info(data);
};
export function UserProfileDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <BadgeCheck />
            Manage Profile
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <UserProfileEditor setOpen={setOpen} onSubmit={onSave} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
