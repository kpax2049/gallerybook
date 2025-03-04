import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Ellipsis } from 'lucide-react';

interface ThreeDotMenuProps {
  props?: React.ComponentProps<typeof ThreeDotMenu>;
  onEdit: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

export function ThreeDotMenu({ onEdit, ...props }: ThreeDotMenuProps) {
  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute rounded-md top-2 right-2 p-1 text-gray-100 hover:bg-gray-200 dark:text-gray-50 dark:hover:bg-gray-800"
        >
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4}>
        <DropdownMenuItem onClick={(e) => onEdit(e)}>Edit</DropdownMenuItem>
        <DropdownMenuItem>Delete</DropdownMenuItem>
        <DropdownMenuItem>Share</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
