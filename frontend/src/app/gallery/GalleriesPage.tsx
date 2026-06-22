import * as React from 'react';
import { Link, useLocation, useMatch, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowDownAZ,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Bell,
  Check,
  Filter,
  Grid3X3,
  ImageIcon,
  List,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { createDraftGallery, editGallery, Gallery } from '@/api/gallery';
import { getUserInitials } from '@/api/user';
import { signout } from '@/api/auth';
import { useGalleries } from '@/hooks/use-gallery';
import { cn } from '@/lib/utils';
import { isAdmin } from '@/lib/authz';
import { useTheme } from '@/components/theme-provider';
import { useGalleryListState } from '@/stores/galleryStore';
import { useUserStore } from '@/stores/userStore';
import { UserProfileDialog } from '@/app/userProfile/UserProfileDialog';
import { AccountLegalFooter, ShelfColophon } from '@/components/LegalColophon';
import {
  FilterState,
  filtersToQuery,
  queryToFilters,
  queryToSort,
  SortKey,
  SortState,
  sortToQuery,
} from './gallery-query-params';
import { GalleryCard } from './GalleryCard';
import { GalleryRow } from './GalleryRow';
import logoMint from '@/assets/GB-logo-mint.png';
import logoTeal from '@/assets/GB-logo-teal.png';

type ReactionPatch = { like?: boolean; favorite?: boolean };
type ViewMode = 'grid' | 'list';
type FilterKey =
  | 'all'
  | 'favorites'
  | 'likes'
  | 'drafts'
  | 'comments'
  | 'trending'
  | 'following';

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'favorites', label: 'Favorites' },
  { key: 'likes', label: 'Likes' },
  { key: 'drafts', label: 'Drafts' },
  { key: 'comments', label: 'Comments' },
  { key: 'trending', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

const SORT_LABELS: Record<SortKey, string> = {
  updatedAt: 'Recently updated',
  createdAt: 'Date created',
  title: 'Title',
  views: 'Most viewed',
  likes: 'Most liked',
  comments: 'Most commented',
};

const tiltFor = (index: number) => {
  const tilts = ['-2.2deg', '1.4deg', '-.9deg', '2.1deg', '-1.5deg', '.8deg'];
  return tilts[index % tilts.length];
};

export default function GalleriesPage() {
  const onList = useMatch({ path: '/galleries', end: true }) != null;
  return onList ? <GalleriesListPage /> : null;
}

function GalleriesListPage() {
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useUserStore((state) => state.user);
  const { sort, setSort, filters, setFilters, pager, setPager } =
    useGalleryListState();
  const [view, setView] = React.useState<ViewMode>(() =>
    sp.get('view') === 'list' ? 'list' : 'grid'
  );
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingGallery] = React.useState<Gallery | null>(null);
  const [reactionOverrides, setReactionOverrides] = React.useState<
    Record<number, { like: boolean; favorite: boolean }>
  >({});
  const [deletedGalleryIds, setDeletedGalleryIds] = React.useState<Set<number>>(
    () => new Set()
  );
  const canCreateGalleries = isAdmin(currentUser);

  const activeFilter = getActiveFilter(filters, sort);

  React.useEffect(() => {
    const search = location.search || '';
    sessionStorage.setItem(
      'lastGalleryHub',
      JSON.stringify({ hub: activeFilter, search })
    );
  }, [activeFilter, location.search]);

  const buildSearchParams = React.useCallback(
    (
      nextFilters: FilterState,
      nextSort: SortState,
      nextPager: { page: number; pageSize: number },
      nextView: ViewMode
    ) => {
      const next = new URLSearchParams();
      const entries: Record<string, string | string[] | number | undefined> = {
        ...filtersToQuery(nextFilters),
        ...sortToQuery(nextSort),
        page: nextPager.page,
        pageSize: nextPager.pageSize,
        view: nextView === 'list' ? 'list' : undefined,
      };
      for (const [k, v] of Object.entries(entries)) {
        if (v == null || v === '' || (Array.isArray(v) && v.length === 0)) continue;
        if (Array.isArray(v)) next.set(k, v.join(','));
        else next.set(k, String(v));
      }
      return next;
    },
    []
  );

  const paramsEqual = (a: URLSearchParams, b: URLSearchParams) => {
    const aKeys = Array.from(a.keys()).sort();
    const bKeys = Array.from(b.keys()).sort();
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key, index) => key === bKeys[index] && a.get(key) === b.get(key));
  };

  const initFromUrlRef = React.useRef(false);
  const lastUrlWriteRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const spStr = sp.toString();
    if (lastUrlWriteRef.current === spStr) {
      lastUrlWriteRef.current = null;
      return;
    }

    const nextSort = queryToSort(sp);
    const nextFilters = queryToFilters(sp);
    const page = Number(sp.get('page') ?? 1);
    const pageSize = Number(sp.get('pageSize') ?? 24);
    const nextView = sp.get('view') === 'list' ? 'list' : 'grid';

    if (!initFromUrlRef.current) initFromUrlRef.current = true;
    setSort(nextSort);
    setFilters(nextFilters);
    setPager({ page, pageSize });
    setView(nextView);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, location.pathname]);

  React.useEffect(() => {
    if (!initFromUrlRef.current) return;
    const desired = buildSearchParams(filters, sort, pager, view);
    if (!paramsEqual(sp, desired)) {
      const desiredStr = desired.toString();
      lastUrlWriteRef.current = desiredStr;
      setSp(desired, { replace: true });
    }
  }, [buildSearchParams, filters, pager, setSp, sort, sp, view]);

  const { data, loading, error, fetching } = useGalleries({
    sort,
    filters,
    page: pager.page,
    pageSize: pager.pageSize,
  });

  const items = React.useMemo(() => data?.items ?? [], [data?.items]);
  const visibleItems = React.useMemo(
    () => items.filter((item) => !deletedGalleryIds.has(item.id)),
    [deletedGalleryIds, items]
  );
  const serverReactions = React.useMemo(
    () => data?.myReactions ?? {},
    [data?.myReactions]
  );
  const availableTags = React.useMemo(
    () => Array.from(new Set(items.flatMap((item) => item.tags ?? []))).sort(),
    [items]
  );

  const handleReactionChanged = React.useCallback(
    (id: number, next: ReactionPatch) => {
      setReactionOverrides((prev) => {
        const base = serverReactions[id] ?? { like: false, favorite: false };
        const curr = prev[id] ?? base;
        return {
          ...prev,
          [id]: {
            like: next.like ?? curr.like,
            favorite: next.favorite ?? curr.favorite,
          },
        };
      });
    },
    [serverReactions]
  );

  const applyFilterTab = (key: FilterKey) => {
    if (key === 'comments') {
      navigate('/me/comments?scope=onMyGalleries');
      return;
    }

    const base: FilterState = {
      ...filters,
      status: new Set(),
      owner: 'any',
      favoriteBy: undefined,
      likedBy: undefined,
      followedOnly: false,
    };
    let nextSort = sort;
    let nextFilters = base;

    if (key === 'favorites') nextFilters = { ...base, favoriteBy: 'me' };
    if (key === 'likes') nextFilters = { ...base, likedBy: 'me' };
    if (key === 'drafts') {
      nextFilters = { ...base, owner: 'me', status: new Set(['DRAFT']) };
    }
    if (key === 'trending') nextSort = { key: 'likes', dir: 'desc' };
    if (key === 'following') nextFilters = { ...base, followedOnly: true };

    setFilters(nextFilters);
    setSort(nextSort);
    setPager({ ...pager, page: 1 });
  };

  const updateSearch = (search: string) => {
    setFilters({ ...filters, search });
    setPager({ ...pager, page: 1 });
  };

  const openNewGallery = () => {
    navigate('/galleries/new');
  };

  const openEditGallery = (gallery: Gallery) => {
    navigate(`/galleries/edit/${gallery.id}`);
  };

  const renderGridCard = (g: Gallery, index: number) => {
    const base = serverReactions[g.id] ?? { like: false, favorite: false };
    const current = reactionOverrides[g.id] ?? base;
    const likesDelta = (current.like ? 1 : 0) - (base.like ? 1 : 0);
    const favsDelta = (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);

    return (
      <GalleryCard
        key={g.id}
        to={`/galleries/${g.slug ?? g.id}`}
        item={g}
        comments={data?.commentCounts?.[g.id] ?? 0}
        myReaction={current}
        likesCountOverride={(g.likesCount ?? 0) + likesDelta}
        favoritesCountOverride={(g.favoritesCount ?? 0) + favsDelta}
        onReactionChanged={(next) => handleReactionChanged(g.id, next)}
        onDeleted={(id) => setDeletedGalleryIds((prev) => new Set(prev).add(id))}
        onEditRequested={() => openEditGallery(g)}
        style={
          {
            '--gb-tilt': tiltFor(index),
            '--gb-delay': `${index * 45}ms`,
          } as React.CSSProperties
        }
      />
    );
  };

  const renderRow = (g: Gallery, index: number) => {
    const base = serverReactions[g.id] ?? { like: false, favorite: false };
    const current = reactionOverrides[g.id] ?? base;
    const likesDelta = (current.like ? 1 : 0) - (base.like ? 1 : 0);
    const favsDelta = (current.favorite ? 1 : 0) - (base.favorite ? 1 : 0);

    return (
      <GalleryRow
        key={g.id}
        item={g}
        comments={data?.commentCounts?.[g.id] ?? 0}
        myReaction={current}
        likesCountOverride={(g.likesCount ?? 0) + likesDelta}
        favoritesCountOverride={(g.favoritesCount ?? 0) + favsDelta}
        onReactionChanged={(next) => handleReactionChanged(g.id, next)}
        onDeleted={(id) => setDeletedGalleryIds((prev) => new Set(prev).add(id))}
        onEditRequested={() => openEditGallery(g)}
        style={{ '--gb-delay': `${index * 45}ms` } as React.CSSProperties}
      />
    );
  };

  return (
    <div className="gb-page">
      <DeskHeader onCreate={openNewGallery} />
      <main className="gb-shell flex min-h-[calc(100svh-69px)] flex-col px-0 pb-4 pt-8 sm:px-3">
        <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="gb-serif text-[33px] font-medium leading-none tracking-normal">
              My Galleries
            </h1>
            <p className="gb-hand mt-1 text-[22px] font-semibold text-[var(--gb-hand)]">
              your shelf · {(data?.total ?? visibleItems.length).toLocaleString()} albums
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gb-ink-mute)]" />
              <Input
                value={filters.search}
                onChange={(event) => updateSearch(event.target.value)}
                placeholder="Search galleries..."
                className="gb-field h-10 w-[min(78vw,320px)] rounded-[11px] pl-9 shadow-none focus-visible:ring-[var(--gb-accent)]"
                aria-label="Search galleries"
              />
            </label>

            <SortMenu sort={sort} onChange={setSort} />

            <Button
              type="button"
              variant="outline"
              onClick={() => setFiltersOpen(true)}
              className="gb-chip h-10 rounded-[11px] px-3 shadow-none"
              aria-pressed={countActiveFilters(filters) > 0}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {countActiveFilters(filters) > 0 && (
                <span className="ml-1 rounded-full bg-[var(--gb-accent)] px-1.5 text-[11px] font-semibold text-[var(--gb-accent-ink)]">
                  {countActiveFilters(filters)}
                </span>
              )}
            </Button>

            <div className="gb-chip inline-flex h-10 items-center rounded-[11px] p-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="Grid view"
                aria-pressed={view === 'grid'}
                onClick={() => setView('grid')}
                className={cn(
                  'h-8 w-8 rounded-lg text-[var(--gb-ink-soft)] hover:bg-[var(--gb-accent-soft)]',
                  view === 'grid' && 'bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]'
                )}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label="List view"
                aria-pressed={view === 'list'}
                onClick={() => setView('list')}
                className={cn(
                  'h-8 w-8 rounded-lg text-[var(--gb-ink-soft)] hover:bg-[var(--gb-accent-soft)]',
                  view === 'list' && 'bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]'
                )}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </section>

        <nav className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              data-active={activeFilter === tab.key}
              onClick={() => applyFilterTab(tab.key)}
              className="gb-chip relative h-10 shrink-0 rounded-full px-4 text-sm font-medium"
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {error && !loading && (
          <div className="mt-6 rounded-[14px] border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error.message}
          </div>
        )}

        <section className={cn('mt-8', fetching && 'opacity-80')}>
          {view === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(252px,1fr))] gap-x-[30px] gap-y-[44px]">
              {loading
                ? Array.from({ length: 8 }).map((_, index) => <GridSkeleton key={index} />)
                : visibleItems.map(renderGridCard)}
              {!loading && canCreateGalleries && (
                <button
                  type="button"
                  onClick={openNewGallery}
                  className="flex min-h-[276px] flex-col items-center justify-center gap-3 rounded border border-dashed border-[var(--gb-border-2)] bg-[var(--gb-surface)] p-6 text-center text-[var(--gb-ink-soft)] transition hover:-translate-y-1 hover:border-[var(--gb-accent)] hover:bg-[var(--gb-accent-soft)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--gb-border)]">
                    <Plus className="h-5 w-5" />
                  </span>
                  <span className="gb-hand text-2xl font-semibold">Start an album</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {loading
                ? Array.from({ length: 6 }).map((_, index) => <ListSkeleton key={index} />)
                : visibleItems.map(renderRow)}
            </div>
          )}
        </section>

        {!loading && visibleItems.length === 0 && !error && (
          <div className="mt-14 flex flex-col items-center gap-3 text-center text-[var(--gb-ink-soft)]">
            <p className="gb-hand text-2xl">No galleries found.</p>
            {canCreateGalleries && (
              <Button onClick={openNewGallery} className="rounded-[11px] bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]/90">
                <Plus className="mr-2 h-4 w-4" />
                Start an album
              </Button>
            )}
          </div>
        )}

        {data && data.total > pager.pageSize && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Button
              variant="outline"
              className="gb-chip rounded-[11px]"
              disabled={pager.page <= 1}
              onClick={() => setPager({ ...pager, page: pager.page - 1 })}
            >
              Prev
            </Button>
            <div className="text-sm text-[var(--gb-ink-soft)]">
              Page {pager.page} of {Math.ceil(data.total / pager.pageSize)}
            </div>
            <Button
              variant="outline"
              className="gb-chip rounded-[11px]"
              disabled={pager.page >= Math.ceil(data.total / pager.pageSize)}
              onClick={() => setPager({ ...pager, page: pager.page + 1 })}
            >
              Next
            </Button>
          </div>
        )}

        {!loading && !error && <ShelfColophon />}
      </main>

      <FiltersDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        availableTags={availableTags}
        onApply={(next) => {
          setFilters(next);
          setPager({ ...pager, page: 1 });
          setFiltersOpen(false);
        }}
        onReset={() => {
          setFilters({
            ...filters,
            status: new Set(),
            owner: 'any',
            range: 'any',
            hasCover: null,
            hasTags: null,
            hasComments: null,
            tags: [],
            favoriteBy: undefined,
            likedBy: undefined,
            followedOnly: false,
          });
          setPager({ ...pager, page: 1 });
          setFiltersOpen(false);
        }}
      />
      <GalleryEditDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        gallery={editingGallery}
        canSave={isAdmin(currentUser)}
      />
    </div>
  );
}

export function DeskHeader({ onCreate }: { onCreate: () => void }) {
  const currentUser = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signout();
    } finally {
      useUserStore.getState().clearUser();
      localStorage.removeItem('ACCESS_TOKEN');
      navigate('/login');
    }
  };

  return (
    <header className="gb-header">
      <div className="gb-shell gb-header-inner">
        <Link to="/galleries" className="gb-brand" aria-label="Gallery Book home">
          <span className="gb-brand-mark" aria-hidden="true">
            <img
              src={logoTeal}
              alt=""
              width={40}
              height={40}
              className="gb-brand-logo gb-brand-logo--teal"
            />
            <img
              src={logoMint}
              alt=""
              width={40}
              height={40}
              className="gb-brand-logo gb-brand-logo--mint"
            />
          </span>
          <span className="gb-wordmark">
            <span className="gb-wordmark-gallery">Gallery</span>
            <span className="gb-wordmark-book">Book</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {isAdmin(currentUser) && (
            <Button
              type="button"
              onClick={onCreate}
              className="h-10 rounded-[11px] bg-[var(--gb-accent)] px-3 text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              New album
            </Button>
          )}
          <AccountMenu onLogout={handleLogout} />
        </div>
      </div>
    </header>
  );
}

function AccountMenu({ onLogout }: { onLogout: () => void }) {
  const currentUser = useUserStore((state) => state.user);
  const { theme, setTheme } = useTheme();
  const avatarSrc = currentUser?.profile?.avatarUrl;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-10 gap-2 rounded-full border border-[var(--gb-border)] bg-[var(--gb-surface)] px-2 text-[var(--gb-ink)] hover:bg-[var(--gb-accent-soft)]"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? currentUser?.username ?? 'Account'} />
            <AvatarFallback>{getUserInitials(currentUser ?? undefined)}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate text-sm font-medium sm:block">
            {currentUser?.fullName ?? currentUser?.username ?? 'Account'}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="gb-menu w-[316px] p-3">
        <div className="flex items-center gap-3 px-1 pb-3">
          <Avatar className="h-11 w-11">
            <AvatarImage src={avatarSrc} alt={currentUser?.fullName ?? currentUser?.username ?? 'Account'} />
            <AvatarFallback>{getUserInitials(currentUser ?? undefined)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{currentUser?.fullName ?? currentUser?.username}</div>
            <div className="truncate text-xs text-[var(--gb-ink-soft)]">{currentUser?.email}</div>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-3 gap-1 rounded-[11px] border border-[var(--gb-border)] bg-[var(--gb-surface)] p-1">
          {[
            { key: 'light' as const, label: 'Light', icon: Sun },
            { key: 'dark' as const, label: 'Dark', icon: Moon },
            { key: 'system' as const, label: 'System', icon: Monitor },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              aria-pressed={theme === key}
              onClick={() => setTheme(key)}
              className={cn(
                'inline-flex h-9 items-center justify-center gap-1 rounded-lg text-xs text-[var(--gb-ink-soft)] transition hover:bg-[var(--gb-accent-soft)] hover:text-[var(--gb-ink)]',
                theme === key && 'bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)] hover:text-[var(--gb-accent-ink)]'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        <UserProfileDialog />
        <DropdownMenuItem className="h-10 rounded-[10px] focus:bg-[var(--gb-accent-soft)]">
          <Bell className="mr-2 h-4 w-4" />
          Notifications
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={onLogout}
          className="h-10 rounded-[10px] text-destructive focus:bg-destructive/10 focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </DropdownMenuItem>
        <AccountLegalFooter />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SortMenu({
  sort,
  onChange,
}: {
  sort: SortState;
  onChange: (sort: SortState) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" className="gb-chip h-10 rounded-[11px] px-3 shadow-none">
          <ArrowUpDown className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{SORT_LABELS[sort.key]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="gb-menu w-56 p-1">
        {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
          <DropdownMenuItem
            key={key}
            onSelect={() => onChange({ ...sort, key })}
            className="rounded-[10px] focus:bg-[var(--gb-accent-soft)]"
          >
            <span className="flex-1">{SORT_LABELS[key]}</span>
            {sort.key === key && <Check className="h-4 w-4 text-[var(--gb-accent)]" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem
          onSelect={() => onChange({ ...sort, dir: sort.dir === 'asc' ? 'desc' : 'asc' })}
          className="rounded-[10px] focus:bg-[var(--gb-accent-soft)]"
        >
          <ArrowDownAZ className="mr-2 h-4 w-4" />
          {sort.dir === 'asc' ? 'Ascending' : 'Descending'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FiltersDrawer({
  open,
  onOpenChange,
  filters,
  availableTags,
  onApply,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: FilterState;
  availableTags: string[];
  onApply: (filters: FilterState) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = React.useState(filters);

  React.useEffect(() => {
    setDraft({
      ...filters,
      status: new Set(filters.status),
      tags: [...filters.tags],
    });
  }, [filters, open]);

  const toggleStatus = (status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => {
    const next = new Set(draft.status);
    if (next.has(status)) next.delete(status);
    else next.add(status);
    setDraft({ ...draft, status: next });
  };

  const toggleTag = (tag: string) => {
    setDraft({
      ...draft,
      tags: draft.tags.includes(tag)
        ? draft.tags.filter((item) => item !== tag)
        : [...draft.tags, tag],
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gb-panel w-[392px] max-w-[calc(100vw-20px)] border-l-0 p-6 [&>button]:text-[var(--gb-ink)]">
        <SheetHeader className="text-left">
          <SheetTitle className="gb-serif text-2xl font-medium text-[var(--gb-ink)]">
            Filters
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <FilterSection title="Status">
            {(['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const).map((status) => (
              <Pill key={status} active={draft.status.has(status)} onClick={() => toggleStatus(status)}>
                {titleCase(status)}
              </Pill>
            ))}
          </FilterSection>

          <FilterSection title="Owner">
            <Pill active={draft.owner === 'me'} onClick={() => setDraft({ ...draft, owner: draft.owner === 'me' ? 'any' : 'me' })}>
              My galleries
            </Pill>
          </FilterSection>

          <FilterSection title="Flags">
            <Pill active={draft.hasCover === true} onClick={() => setDraft({ ...draft, hasCover: draft.hasCover === true ? null : true })}>
              Has cover
            </Pill>
            <Pill active={draft.hasTags === true} onClick={() => setDraft({ ...draft, hasTags: draft.hasTags === true ? null : true })}>
              Has tags
            </Pill>
            <Pill active={draft.hasComments === true} onClick={() => setDraft({ ...draft, hasComments: draft.hasComments === true ? null : true })}>
              Has comments
            </Pill>
          </FilterSection>

          <FilterSection title="Updated">
            {[
              ['any', 'Any time'],
              ['7d', 'Last 7 days'],
              ['30d', 'Last 30 days'],
              ['90d', 'Last 90 days'],
            ].map(([key, label]) => (
              <Pill
                key={key}
                active={draft.range === key}
                onClick={() => setDraft({ ...draft, range: key as FilterState['range'] })}
              >
                {label}
              </Pill>
            ))}
          </FilterSection>

          <FilterSection title="Tags">
            <Input
              readOnly
              value=""
              placeholder="No tags yet."
              className="gb-field h-10 rounded-[11px]"
            />
            {availableTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {availableTags.slice(0, 18).map((tag) => (
                  <Pill key={tag} active={draft.tags.includes(tag)} onClick={() => toggleTag(tag)}>
                    {tag}
                  </Pill>
                ))}
              </div>
            )}
          </FilterSection>
        </div>

        <SheetFooter className="mt-8 flex-row justify-between sm:justify-between sm:space-x-0">
          <Button variant="ghost" onClick={onReset} className="rounded-[11px] text-[var(--gb-ink-soft)] hover:bg-[var(--gb-accent-soft)]">
            Reset
          </Button>
          <SheetClose asChild>
            <Button onClick={() => onApply(draft)} className="rounded-[11px] bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]/90">
              Apply
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function GalleryEditDialog({
  open,
  onOpenChange,
  gallery,
  canSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: Gallery | null;
  canSave: boolean;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagDraft, setTagDraft] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setTitle(gallery?.title ?? '');
    setDescription(gallery?.description ?? '');
    setTags(gallery?.tags ?? []);
    setTagDraft('');
  }, [gallery, open]);

  const addTag = () => {
    const value = tagDraft.trim();
    if (!value || tags.includes(value)) return;
    setTags([...tags, value]);
    setTagDraft('');
  };

  const save = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      if (gallery) {
        await editGallery({ title, description, tags }, gallery.id);
      } else {
        const created = await createDraftGallery({ title, description, tags });
        navigate(`/galleries/edit/${created.id}`);
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gb-panel w-[480px] max-w-[calc(100vw-24px)] border-0 p-6 text-[var(--gb-ink)]">
        <DialogHeader>
          <DialogTitle className="gb-serif text-2xl font-medium">
            {gallery ? 'Edit gallery' : 'Start an album'}
          </DialogTitle>
          <DialogDescription className="text-[var(--gb-ink-soft)]">
            Keep the shelf details tidy before you open the editor.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="grid gap-1.5 text-sm font-medium">
            Title
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="gb-field h-11 rounded-[11px] focus-visible:ring-[3px] focus-visible:ring-[var(--gb-accent-soft)]"
              placeholder="Weekend in Lisbon"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium">
            Description
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="gb-field min-h-24 rounded-[11px] focus-visible:ring-[3px] focus-visible:ring-[var(--gb-accent-soft)]"
              placeholder="A few notes about this album..."
            />
          </label>

          <div className="space-y-2">
            <div className="text-sm font-medium">Gallery cover</div>
            <div className="flex items-center gap-3">
              <Button type="button" size="icon" variant="outline" className="gb-chip rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="h-28 flex-1 overflow-hidden rounded bg-[var(--gb-surface)]">
                {gallery?.thumbnail ? (
                  <img src={gallery.thumbnail} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[var(--gb-ink-mute)]">
                    <ImageIcon className="mr-2 h-5 w-5" />
                    No cover yet
                  </div>
                )}
              </div>
              <Button type="button" size="icon" variant="outline" className="gb-chip rounded-full">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">Tags</div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setTags(tags.filter((item) => item !== tag))}
                  className="inline-flex h-8 items-center gap-1 rounded-full bg-[var(--gb-accent-soft)] px-3 text-sm text-[var(--gb-ink)]"
                >
                  {tag}
                  <X className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addTag();
                  }
                }}
                className="gb-field h-10 rounded-[11px]"
                placeholder="Add a tag..."
              />
              <Button type="button" variant="outline" onClick={addTag} className="gb-chip rounded-[11px]">
                Add
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={save}
            disabled={!canSave || saving}
            className="h-11 w-full rounded-[11px] bg-[var(--gb-accent)] text-[var(--gb-accent-ink)] hover:bg-[var(--gb-accent)]/90"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-[var(--gb-ink-mute)]">
        {title}
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function Pill({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-active={active}
      onClick={onClick}
      className="gb-chip rounded-full px-3 py-1.5 text-sm"
    >
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="gb-paper p-[11px] pb-10">
      <Skeleton className="h-[184px] rounded-sm" />
      <Skeleton className="mt-4 h-5 w-3/4" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="rounded-[14px] border border-[var(--gb-border)] bg-[var(--gb-surface-2)] p-3">
      <div className="flex gap-4">
        <Skeleton className="h-[74px] w-[116px] rounded" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
    </div>
  );
}

function getActiveFilter(filters: FilterState, sort: SortState): FilterKey {
  if (filters.favoriteBy === 'me') return 'favorites';
  if (filters.likedBy === 'me') return 'likes';
  if (filters.owner === 'me' && filters.status?.has('DRAFT')) return 'drafts';
  if (filters.followedOnly) return 'following';
  if (sort.key === 'likes' && sort.dir === 'desc') return 'trending';
  return 'all';
}

function countActiveFilters(filters: FilterState) {
  return (
    (filters.status?.size ?? 0) +
    (filters.owner === 'me' ? 1 : 0) +
    (filters.range !== 'any' ? 1 : 0) +
    (filters.hasCover != null ? 1 : 0) +
    (filters.hasTags != null ? 1 : 0) +
    (filters.hasComments != null ? 1 : 0) +
    (filters.tags?.length ?? 0) +
    (filters.favoriteBy != null ? 1 : 0) +
    (filters.likedBy != null ? 1 : 0) +
    (filters.followedOnly ? 1 : 0)
  );
}

function titleCase(value: string) {
  return value.slice(0, 1) + value.slice(1).toLowerCase();
}
