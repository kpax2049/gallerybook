import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowUpDown,
  Filter,
  // ChevronDown,
  X,
  Users,
  ImageIcon,
  MessageSquare,
  Tags,
  Clock,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------- Types

export type SortKey =
  | 'updatedAt'
  | 'createdAt'
  | 'title'
  | 'views'
  | 'likes'
  | 'comments';
export type SortDir = 'asc' | 'desc';

export interface SortState {
  key: SortKey;
  dir: SortDir;
}

export interface FilterState {
  status: Set<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>;
  owner: 'me' | 'any';
  range: 'any' | '7d' | '30d' | '90d';
  hasCover: boolean | null;
  hasTags: boolean | null;
  hasComments: boolean | null;
  tags: string[];
  search: string;
}

export interface GalleryListToolbarProps {
  className?: string;
  sort: SortState;
  filters: FilterState;
  availableTags?: string[];
  onSortChange: (s: SortState) => void;
  onFiltersChange: (f: FilterState) => void;
  resultCount?: number;
  // NEW (optional): external control for view mode; if omitted we manage it locally
  view?: 'grid' | 'list';
  onViewChange?: (v: 'grid' | 'list') => void;
}

// ---------- Defaults

export const defaultSort: SortState = { key: 'updatedAt', dir: 'desc' };

export const defaultFilters: FilterState = {
  status: new Set<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>(),
  owner: 'any',
  range: 'any',
  hasCover: null,
  hasTags: null,
  hasComments: null,
  tags: [],
  search: '',
};

// ---------- Toolbar (compact single row)

function GalleryListToolbarInner(props: GalleryListToolbarProps) {
  const {
    className,
    sort,
    filters,
    onSortChange,
    onFiltersChange,
    availableTags = [],
    resultCount,
    view,
    onViewChange,
  } = props;

  // Local draft for debounced search (commit after 300ms idle)
  const [searchDraft, setSearchDraft] = React.useState(filters.search);
  React.useEffect(() => {
    if (filters.search !== searchDraft) setSearchDraft(filters.search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.search]);

  React.useEffect(() => {
    if (searchDraft === filters.search) return;
    const id = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchDraft });
    }, 300);
    return () => clearTimeout(id);
  }, [searchDraft, filters, onFiltersChange]);

  // View toggle (controlled if onViewChange is provided)
  const [localView, setLocalView] = React.useState<'grid' | 'list'>(
    view ?? 'grid'
  );
  React.useEffect(() => {
    if (view && view !== localView) setLocalView(view);
  }, [view, localView]);
  const setView = (v: 'grid' | 'list') => {
    if (onViewChange) onViewChange(v);
    else setLocalView(v);
  };
  const currentView = view ?? localView;

  const activeFilters = countActiveFilters(filters);

  return (
    <TooltipProvider>
      <div
        className={cn(
          'flex h-10 items-center gap-2 px-1', // slim row
          className
        )}
      >
        {/* Search (compact) */}
        <Input
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder="Search…"
          className="h-9 max-w-xs"
          aria-label="Search galleries"
        />

        {/* Sort (icon button + menu) */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Sort"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Sort</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={sort.key}
              onValueChange={(v) =>
                onSortChange({ ...sort, key: v as SortKey })
              }
            >
              <DropdownMenuRadioItem value="updatedAt">
                Recently updated
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="createdAt">
                Date created
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="title">Title</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="views">
                Most viewed
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="likes">
                Most liked
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="comments">
                Most commented
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={sort.dir === 'asc'}
              onCheckedChange={() =>
                onSortChange({
                  ...sort,
                  dir: sort.dir === 'asc' ? 'desc' : 'asc',
                })
              }
            >
              Ascending (A→Z / Oldest)
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filter (opens sheet) */}
        <FilterSheet
          filters={filters}
          onChange={onFiltersChange}
          availableTags={availableTags}
        >
          <Button
            variant={activeFilters > 0 ? 'default' : 'outline'}
            size="sm"
            className="h-8 px-2"
          >
            <Filter className="h-4 w-4 mr-1.5" />
            Filters{activeFilters > 0 ? ` (${activeFilters})` : ''}
          </Button>
        </FilterSheet>

        {/* Spacer */}
        <div className="flex-1" />

        {/* View toggle (icon buttons) */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === 'grid' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                aria-label="Grid view"
                onClick={() => setView('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Grid view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={currentView === 'list' ? 'default' : 'outline'}
                size="icon"
                className="h-9 w-9"
                aria-label="List view"
                onClick={() => setView('list')}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>List view</TooltipContent>
          </Tooltip>
        </div>

        {/* Result count (muted, right-aligned) */}
        {typeof resultCount === 'number' && (
          <>
            <Separator orientation="vertical" className="mx-1 h-5" />
            <Badge
              variant="secondary"
              className="h-6 rounded-full px-2 tabular-nums font-medium"
              aria-label={`${resultCount} results`}
              title={`${resultCount.toLocaleString()} results`}
            >
              {resultCount.toLocaleString()}
            </Badge>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}

// Memoized export to avoid re-renders on unrelated parent changes
export const GalleryListToolbar = React.memo(GalleryListToolbarInner);

// ---------- Filter Sheet (moved all filter UI into a right drawer)

function FilterSheet({
  children,
  filters,
  onChange,
  availableTags,
  tooltip = 'Filter',
}: {
  children: React.ReactElement; // ← must be a single element (the Button)
  filters: FilterState;
  onChange: (f: FilterState) => void;
  availableTags: string[];
  tooltip?: string;
}) {
  // helpers
  const toggleSet = <T extends string>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  };
  const boolCycle = (val: boolean | null): boolean | null =>
    val === null ? true : val ? false : null;

  const setTag = (tag: string) => {
    const exists = filters.tags.includes(tag);
    onChange({
      ...filters,
      tags: exists
        ? filters.tags.filter((t) => t !== tag)
        : [...filters.tags, tag],
    });
  };

  return (
    <Sheet>
      <Tooltip>
        {/* Both triggers wrap the SAME element */}
        <SheetTrigger asChild>
          <TooltipTrigger asChild>{children}</TooltipTrigger>
        </SheetTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>

      <SheetContent side="right" className="w-[380px] sm:w-[420px]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Quick Filters Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Status
              </div>
              <ToggleChip
                pressed={filters.status.has('DRAFT')}
                onPressedChange={() =>
                  onChange({
                    ...filters,
                    status: toggleSet(filters.status, 'DRAFT'),
                  })
                }
                label="Draft"
              />
              <ToggleChip
                pressed={filters.status.has('PUBLISHED')}
                onPressedChange={() =>
                  onChange({
                    ...filters,
                    status: toggleSet(filters.status, 'PUBLISHED'),
                  })
                }
                label="Published"
              />
              <ToggleChip
                pressed={filters.status.has('ARCHIVED')}
                onPressedChange={() =>
                  onChange({
                    ...filters,
                    status: toggleSet(filters.status, 'ARCHIVED'),
                  })
                }
                label="Archived"
              />
            </div>

            {/* Owner */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Owner
              </div>
              <ToggleChip
                pressed={filters.owner === 'me'}
                onPressedChange={() =>
                  onChange({
                    ...filters,
                    owner: filters.owner === 'me' ? 'any' : 'me',
                  })
                }
                label="My galleries"
                icon={<Users className="h-3.5 w-3.5" />}
              />
            </div>

            {/* Flags */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">
                Flags
              </div>
              <CycleChip
                value={filters.hasCover}
                onCycle={() =>
                  onChange({
                    ...filters,
                    hasCover: boolCycle(filters.hasCover),
                  })
                }
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                label="Has cover"
              />
              <CycleChip
                value={filters.hasTags}
                onCycle={() =>
                  onChange({ ...filters, hasTags: boolCycle(filters.hasTags) })
                }
                icon={<Tags className="h-3.5 w-3.5" />}
                label="Has tags"
              />
              <CycleChip
                value={filters.hasComments}
                onCycle={() =>
                  onChange({
                    ...filters,
                    hasComments: boolCycle(filters.hasComments),
                  })
                }
                icon={<MessageSquare className="h-3.5 w-3.5" />}
                label="Has comments"
              />
            </div>
          </div>

          <Separator />

          {/* Date range */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Updated
            </div>
            <div className="flex flex-wrap gap-2">
              {(['any', '7d', '30d', '90d'] as const).map((r) => (
                <Badge
                  key={r}
                  variant={filters.range === r ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => onChange({ ...filters, range: r })}
                >
                  {rangeLabel(r)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tag picker */}
          <div>
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Tags
            </div>
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                <CommandEmpty>No tags found.</CommandEmpty>
                <CommandGroup>
                  {availableTags.map((t) => {
                    const selected = filters.tags.includes(t);
                    return (
                      <CommandItem
                        key={t}
                        onSelect={() => setTag(t)}
                        className="flex justify-between"
                      >
                        <span>{t}</span>
                        {selected && (
                          <Badge variant="secondary">Selected</Badge>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>

            {filters.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-1">
                {filters.tags.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1">
                    {t}
                    <button
                      aria-label={`Remove ${t}`}
                      className="ml-1 rounded hover:bg-muted/70"
                      onClick={() => setTag(t)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button
            variant="ghost"
            onClick={() => onChange({ ...defaultFilters })}
          >
            Reset
          </Button>
          <SheetClose asChild>
            <Button>Apply</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Small UI helpers

function ToggleChip({
  pressed,
  onPressedChange,
  label,
  icon,
}: {
  pressed: boolean;
  onPressedChange: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'h-8 px-2 rounded-full text-xs border transition',
        pressed
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted'
      )}
      onClick={onPressedChange}
      aria-pressed={pressed}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}
      </span>
    </button>
  );
}

function CycleChip({
  value, // null → Any, true → Yes, false → No
  onCycle,
  label,
  icon,
}: {
  value: boolean | null;
  onCycle: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  const text = value === null ? 'Any' : value ? 'Yes' : 'No';
  return (
    <button
      type="button"
      className={cn(
        'h-8 px-2 rounded-full text-xs border transition',
        value === null
          ? 'bg-background hover:bg-muted'
          : value
            ? 'bg-primary text-primary-foreground border-primary'
            : 'bg-destructive/10 text-destructive border-destructive/30'
      )}
      onClick={onCycle}
      aria-label={`${label}: ${text}`}
      title={`${label}: ${text}`}
    >
      <span className="inline-flex items-center gap-1.5">
        {icon}
        {label}: {text}
      </span>
    </button>
  );
}

// ---------- Utilities

function rangeLabel(r: FilterState['range']) {
  switch (r) {
    case 'any':
      return 'Any time';
    case '7d':
      return 'Last 7 days';
    case '30d':
      return 'Last 30 days';
    case '90d':
      return 'Last 90 days';
  }
}

function countActiveFilters(f: FilterState) {
  let n = 0;
  if (f.status.size) n += 1;
  if (f.owner === 'me') n += 1;
  if (f.range !== 'any') n += 1;
  if (f.hasCover !== null) n += 1;
  if (f.hasTags !== null) n += 1;
  if (f.hasComments !== null) n += 1;
  if (f.tags.length) n += 1;
  return n;
}
