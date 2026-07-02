import * as React from 'react';
import { FolderOpen, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { Folder, FolderCoverGallery } from '@/api/folder';
import { Gallery } from '@/api/gallery';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export const FOLDER_COLORS = [
  '#436074',
  '#6d5a44',
  '#7a5a86',
  '#4f7a5e',
  '#b6493f',
  '#3f8f78',
  '#8a5f30',
  '#4a6d8a',
];

const fallbackPhoto = 'linear-gradient(150deg,#caa86d,#7e8d6c 60%,#4f5b44)';
type FolderCover = Pick<Gallery, 'title' | 'thumbnail'> | FolderCoverGallery;

function darken(hex: string, amount: number) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const next = clean
    .match(/.{2}/g)
    ?.map((part) => {
      const value = Math.max(0, Math.min(255, parseInt(part, 16) - amount));
      return value.toString(16).padStart(2, '0');
    })
    .join('');
  return next ? `#${next}` : hex;
}

function albumStyle(color?: string | null) {
  const base = color || FOLDER_COLORS[0];
  return {
    '--folder-color': base,
    '--folder-dark': darken(base, 46),
    '--folder-spine-a': darken(base, 68),
    '--folder-spine-b': darken(base, 28),
  } as React.CSSProperties;
}

function photoStyle(cover?: FolderCover | null) {
  return cover?.thumbnail
    ? ({
        backgroundImage: `url(${cover.thumbnail})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as React.CSSProperties)
    : ({ backgroundImage: fallbackPhoto } as React.CSSProperties);
}

function albumCountText(count: number) {
  return `${count.toLocaleString()} ${count === 1 ? 'album' : 'albums'}`;
}

export function FolderAlbumObject({
  folder,
  cover,
  label,
  size = 'grid',
}: {
  folder: Pick<Folder, 'name' | 'color' | 'galleriesCount'>;
  cover?: FolderCover | null;
  label?: string;
  size?: 'grid' | 'row';
}) {
  const isRow = size === 'row';
  return (
    <div
      className={cn(
        'relative shrink-0 transition-transform duration-300',
        isRow ? 'h-[88px] w-[118px]' : 'h-[150px] w-[180px]'
      )}
      style={albumStyle(folder.color)}
    >
      <div
        className={cn(
          'absolute rounded-[2px_5px_5px_2px] bg-[repeating-linear-gradient(180deg,#efe6d2_0_3px,#ddd0b4_3px_4px)] shadow-[0_12px_22px_-10px_rgba(0,0,0,.6)]',
          isRow
            ? 'bottom-1 right-[-3px] top-1 w-[110px]'
            : 'bottom-1.5 right-[-5px] top-1.5 w-[170px]'
        )}
      />
      <div
        className={cn(
          'absolute left-0 top-0 overflow-hidden rounded-[3px_8px_8px_3px] bg-[linear-gradient(135deg,var(--folder-color),var(--folder-dark))] shadow-[var(--gb-print-shadow),inset_0_0_0_1px_rgba(0,0,0,.16)] transition-transform duration-300 [transform-origin:left_center]',
          isRow ? 'h-[88px] w-[114px]' : 'h-[150px] w-[174px]'
        )}
      >
        <div
          className={cn(
            'absolute bottom-0 left-0 top-0 z-[4] rounded-l-[3px] bg-[linear-gradient(90deg,var(--folder-spine-a),var(--folder-spine-b))] shadow-[inset_-2px_0_4px_rgba(0,0,0,.3),inset_2px_0_0_rgba(255,255,255,.1)]',
            isRow ? 'w-[9px]' : 'w-[13px]'
          )}
        />
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(0,0,0,.045)_0_1px,transparent_1px_3px),repeating-linear-gradient(90deg,rgba(0,0,0,.045)_0_1px,transparent_1px_3px)]" />
        <div
          className={cn(
            'absolute left-1/2 z-[3] -translate-x-1/2 rotate-[-4deg] bg-[rgba(247,240,224,.72)] shadow-[0_1px_3px_rgba(0,0,0,.2)]',
            isRow ? 'top-1 h-[9px] w-[26px]' : 'top-2 h-4 w-[46px]'
          )}
        />
        <div
          className={cn(
            'absolute left-1/2 rotate-[-3deg] bg-white shadow-[0_8px_16px_-7px_rgba(0,0,0,.6)]',
            isRow
              ? 'top-[9px] w-[60px] -translate-x-[46%] rounded-[1px] p-1 pb-0'
              : 'top-3.5 w-[104px] -translate-x-[46%] rounded-sm p-[7px] pb-0'
          )}
        >
          <div
            className={cn('rounded-[1px]', isRow ? 'h-10' : 'h-[66px]')}
            style={photoStyle(cover)}
          />
          {isRow ? (
            <div className="h-2" />
          ) : (
            <div className="truncate py-1 text-center font-['Caveat'] text-sm font-bold text-[#4a3826]">
              {label || cover?.title || folder.name}
            </div>
          )}
        </div>
        {!isRow && (
          <div className="absolute inset-x-0 bottom-3 text-center text-[11px] tracking-[.05em] text-white/80 shadow-black [text-shadow:0_1px_2px_rgba(0,0,0,.5)]">
            {albumCountText(folder.galleriesCount)}
          </div>
        )}
      </div>
    </div>
  );
}

export function FolderAlbumCard({
  folder,
  cover,
  peek,
  active,
  canManage,
  onOpen,
  onRename,
  onDelete,
  onAddAlbums,
  onGalleryDropped,
}: {
  folder: Folder;
  cover?: FolderCover | null;
  peek: string;
  active?: boolean;
  canManage: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddAlbums: () => void;
  onGalleryDropped?: (galleryId: number) => void;
}) {
  const [dragOver, setDragOver] = React.useState(false);

  return (
    <div className="group text-center">
      <div className="relative inline-flex">
        <button
          type="button"
          onClick={onOpen}
          onDragOver={
            onGalleryDropped
              ? (event) => {
                  event.preventDefault();
                  setDragOver(true);
                }
              : undefined
          }
          onDragLeave={() => setDragOver(false)}
          onDrop={
            onGalleryDropped
              ? (event) => {
                  event.preventDefault();
                  setDragOver(false);
                  const raw = event.dataTransfer.getData('text/gallery-id');
                  const galleryId = Number(raw);
                  if (Number.isFinite(galleryId)) onGalleryDropped(galleryId);
                }
              : undefined
          }
          className={cn(
            'relative inline-flex rounded-md p-2 transition hover:-translate-y-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]',
            active && 'ring-2 ring-[var(--gb-accent)]',
            dragOver &&
              'scale-[1.03] ring-2 ring-[var(--gb-accent)] ring-offset-[6px] ring-offset-[var(--gb-accent-soft)]'
          )}
          aria-label={`Open ${folder.name}`}
        >
          <span className="transition duration-300">
            <FolderAlbumObject
              folder={folder}
              cover={cover}
              label={cover?.title ?? undefined}
            />
          </span>
          {dragOver && (
            <span className="absolute inset-2 z-20 flex items-center justify-center rounded-md bg-[var(--gb-scrim)] text-sm font-semibold text-[var(--gb-ink)] backdrop-blur-sm">
              Drop into {folder.name}
            </span>
          )}
        </button>
        {canManage && (
          <span className="absolute right-0 top-0 z-30 opacity-0 transition group-hover:opacity-100">
            <FolderMenu
              onOpen={onOpen}
              onRename={onRename}
              onDelete={onDelete}
              onAddAlbums={onAddAlbums}
            />
          </span>
        )}
      </div>
      <div className="mt-2 min-w-0">
        <div className="gb-serif truncate text-[18px] font-medium text-[var(--gb-ink)]">
          {folder.name}
        </div>
        <div className="text-xs text-[var(--gb-ink-mute)]">
          {albumCountText(folder.galleriesCount)}
        </div>
        {peek && (
          <div className="gb-hand mt-1 truncate text-[17px] text-[var(--gb-hand)]">
            {peek}
          </div>
        )}
      </div>
    </div>
  );
}

export function FolderListRow({
  folder,
  cover,
  peek,
  canManage,
  onOpen,
  onRename,
  onDelete,
  onAddAlbums,
}: {
  folder: Folder;
  cover?: FolderCover | null;
  peek: string;
  canManage: boolean;
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddAlbums: () => void;
}) {
  return (
    <article className="group relative rounded-[14px] border border-[var(--gb-border)] bg-[var(--gb-surface-2)] p-3 text-[var(--gb-ink)] shadow-[0_18px_40px_-32px_rgba(0,0,0,.55)] transition hover:-translate-y-1 hover:border-[var(--gb-border-2)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={onOpen}
          className="rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gb-accent)]"
          aria-label={`Open ${folder.name}`}
        >
          <FolderAlbumObject folder={folder} cover={cover} size="row" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onOpen}
              className="gb-serif truncate text-lg font-medium"
            >
              {folder.name}
            </button>
            <span className="rounded-full bg-[var(--gb-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--gb-accent)]">
              {albumCountText(folder.galleriesCount)}
            </span>
          </div>
          <div className="gb-hand mt-1 truncate text-[17px] text-[var(--gb-hand)]">
            {peek || 'No albums yet'}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onOpen}
            className="gb-chip h-9 rounded-full px-3 text-[var(--gb-ink-soft)] group-hover:bg-[var(--gb-accent-soft)] group-hover:text-[var(--gb-accent)]"
          >
            <FolderOpen className="mr-2 h-4 w-4" />
            Open
          </Button>
          {canManage && (
            <FolderMenu
              onOpen={onOpen}
              onRename={onRename}
              onDelete={onDelete}
              onAddAlbums={onAddAlbums}
            />
          )}
        </div>
      </div>
    </article>
  );
}

export function NewFolderCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[214px] flex-col items-center justify-center gap-3 rounded border border-dashed border-[var(--gb-border-2)] bg-[var(--gb-surface)] p-6 text-center text-[var(--gb-ink-soft)] transition hover:-translate-y-1 hover:border-[var(--gb-accent)] hover:bg-[var(--gb-accent-soft)]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gb-border)]">
        <Plus className="h-5 w-5" />
      </span>
      <span className="gb-hand text-2xl font-semibold">New folder</span>
    </button>
  );
}

function FolderMenu({
  onOpen,
  onRename,
  onDelete,
  onAddAlbums,
}: {
  onOpen: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAddAlbums: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-[var(--gb-ink-soft)] hover:bg-[var(--gb-accent-soft)]"
          onClick={(event) => event.stopPropagation()}
          aria-label="Folder actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="gb-menu p-1">
        <DropdownMenuItem onSelect={onOpen}>
          <FolderOpen className="mr-2 h-4 w-4" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddAlbums}>
          <Plus className="mr-2 h-4 w-4" />
          Add albums
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onRename}>
          <Pencil className="mr-2 h-4 w-4" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
