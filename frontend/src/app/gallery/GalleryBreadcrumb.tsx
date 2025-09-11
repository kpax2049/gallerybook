import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link, useLocation, useMatch, useParams } from 'react-router-dom';
import { useGalleryStore } from '@/stores/galleryStore';

type Hub = 'my' | 'drafts' | 'favorites' | 'comments' | 'all';
type LastHubPayload = { hub: Hub; search?: string };

function computeHubFromSearch(search: string): Hub {
  const sp = new URLSearchParams(search);
  const favoriteBy = sp.get('favoriteBy');
  const owner = sp.get('owner');
  const status = (sp.get('status') || '').toLowerCase();

  if (favoriteBy === 'me') return 'favorites';
  if (owner === 'me' && status.includes('draft')) return 'drafts';
  if (owner === 'me') return 'my';
  return 'all';
}

function readLastHub(locationSearch: string, onList: boolean): LastHubPayload {
  // 1) If we are currently on /galleries, infer from live search
  if (onList) {
    const hub = computeHubFromSearch(locationSearch);
    return { hub, search: locationSearch };
  }

  // 2) Otherwise read from sessionStorage (set by lists)
  try {
    const raw = sessionStorage.getItem('lastGalleryHub');
    if (raw) {
      const parsed = JSON.parse(raw) as LastHubPayload;
      if (parsed && parsed.hub) return parsed;
    }
  } catch {
    // ignore
  }

  // 3) Fallback
  return { hub: 'all', search: '' };
}

function hubToCrumb(hub: Hub): { label: string; href: string } {
  switch (hub) {
    case 'my':
      return { label: 'My Galleries', href: '/galleries?owner=me' };
    case 'drafts':
      return { label: 'Drafts', href: '/galleries?owner=me&status=draft' };
    case 'favorites':
      return { label: 'Favorites', href: '/galleries?favoriteBy=me' };
    case 'comments':
      return { label: 'Comments', href: '/me/comments?scope=onMyGalleries' };
    case 'all':
    default:
      return { label: 'Galleries', href: '/galleries' };
  }
}

export function GalleryBreadcrumb() {
  const location = useLocation();
  const basePath = '/galleries';

  // Are we exactly on /galleries right now?
  const onList = useMatch({ path: '/galleries', end: true }) != null;

  // Edit/new/view detection (your existing logic)
  const editMatch = useMatch(`${basePath}/edit/:id`);
  const isEditing = Boolean(editMatch);
  const editId = editMatch?.params.id;

  const {
    id: viewIdParam,
    galleryId: viewGalleryIdParam,
    slug,
  } = useParams<{
    id?: string;
    galleryId?: string;
    slug?: string;
  }>();
  const viewId = viewIdParam ?? viewGalleryIdParam;
  const isCreating = location.pathname === `${basePath}/new`;
  const activeId = editId ?? viewId;

  const getGalleryById = useGalleryStore((s) => s.getGalleryById);
  const gallery = activeId ? getGalleryById(Number(activeId)) : undefined;

  // Determine the hub crumb from session (or current query if on list)
  const last = readLastHub(location.search, onList);
  const { label: hubLabel, href: hubHref } = hubToCrumb(last.hub);

  // Final leaf label + href (slug-first; fall back to id; else base)
  const finalHref = isCreating
    ? `${basePath}/new`
    : isEditing && editId
      ? `${basePath}/edit/${editId}`
      : slug
        ? `${basePath}/${slug}`
        : viewId
          ? `${basePath}/${viewId}`
          : basePath;

  const finalLabel = isCreating
    ? 'Create New Gallery'
    : isEditing && (gallery?.title || editId)
      ? `Editing ${gallery?.title ?? editId}`
      : (gallery?.title ??
        (slug ? decodeURIComponent(slug) : undefined) ??
        viewId ??
        'Gallery');

  // Show leaf only when there is a concrete target (create/edit/slug/id)
  const hasLeaf = isCreating || isEditing || Boolean(slug || viewId);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {/* Root */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">My Stuff</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbSeparator />

        {/* Context-aware hub: My / Drafts / Favorites / Comments / Galleries */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={hubHref}>{hubLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Leaf */}
        {hasLeaf && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild aria-current="page">
                <Link to={finalHref}>{finalLabel}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
