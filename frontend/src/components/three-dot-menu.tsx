import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from './ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { Check, Copy, Ellipsis, Pencil, Share2, Trash2 } from 'lucide-react';
import { Gallery } from '@/api/gallery';

interface ThreeDotMenuProps {
  props?: React.ComponentProps<typeof ThreeDotMenu>;
  onEdit: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onDelete: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  gallery: Gallery;
}

export function ThreeDotMenu({
  onEdit,
  onDelete,
  gallery,
  ...props
}: ThreeDotMenuProps) {
  const [copied, setCopied] = React.useState(false);
  const shareUrl = `${location.origin}/galleries/${gallery.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* empty */
    }
  };

  return (
    <DropdownMenu {...props}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -mr-1"
          data-stop-link="true" // don't navigate the card link
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          aria-label="Open menu"
        >
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent sideOffset={4}>
        <DropdownMenuItem data-stop-link="true" onClick={(e) => onEdit(e)}>
          {' '}
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem data-stop-link="true" onClick={(e) => onDelete(e)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Share2 className="mr-2 h-4 w-4" />
            Share…
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            sideOffset={8}
            className="w-[min(320px,85vw)]"
          >
            <div className="p-2">
              <div className="mb-2 text-xs text-muted-foreground">
                Copy link
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  onFocus={(e) => e.currentTarget.select()}
                  className="h-8 font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    copy();
                  }}
                  onMouseDown={(e) => e.preventDefault()} // keep submenu open
                >
                  {copied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
