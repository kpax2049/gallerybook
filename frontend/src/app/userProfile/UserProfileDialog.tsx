import { useState } from 'react';
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
import { UserProfileEditor } from './UserProfileEditor';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { BadgeCheck } from 'lucide-react';

export function UserProfileDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogTrigger asChild>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="h-10 rounded-[10px] focus:bg-[var(--gb-accent-soft)]"
          >
            <BadgeCheck className="mr-2 h-4 w-4" />
            Manage Profile
          </DropdownMenuItem>
        </DialogTrigger>
        <DialogContent className="gb-panel border-0 text-[var(--gb-ink)] sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="gb-serif text-2xl font-medium">
              Edit profile
            </DialogTitle>
            <DialogDescription className="text-[var(--gb-ink-soft)]">
              Make changes to your profile here. Click save when you&apos;re
              done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <UserProfileEditor />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" className="gb-chip rounded-[11px]">
                Close
              </Button>
            </DialogClose>
            {/* <Button type="submit">Save changes</Button> */}
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
