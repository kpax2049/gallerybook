import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link, useLocation, useMatch, useParams } from 'react-router-dom';
import { useGalleryStore } from '@/stores/galleryStore';

export function GalleryBreadcrumb() {
  const location = useLocation();
  const basePath = '/galleries';

  // Match explicit edit route: /galleries/edit/:id
  const editMatch = useMatch(`${basePath}/edit/:id`);
  const isEditing = Boolean(editMatch);
  const editId = editMatch?.params.id;

  // If you also support viewing: /galleries/:id
  const { id: viewIdParam, galleryId: viewGalleryIdParam } = useParams<{
    id?: string;
    galleryId?: string;
  }>();
  const viewId = viewIdParam ?? viewGalleryIdParam;

  const isCreating = location.pathname === `${basePath}/new`;

  // Prefer the ID from the edit match if present; otherwise the view param
  const activeId = editId ?? viewId;

  const getGalleryById = useGalleryStore((s) => s.getGalleryById);
  const gallery = activeId ? getGalleryById(Number(activeId)) : undefined;
  const title = gallery?.title || activeId || 'Gallery';

  let finalLabel = '';
  let finalHref = basePath;

  if (isCreating) {
    finalLabel = 'Create New Gallery';
    finalHref = `${basePath}/new`;
  } else if (isEditing && activeId) {
    finalLabel = `Editing ${title}`;
    finalHref = `${basePath}/edit/${activeId}`;
  } else if (activeId) {
    finalLabel = title;
    finalHref = `${basePath}/${activeId}`;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">My Stuff</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to={basePath}>Galleries</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild aria-current="page">
            <Link to={finalHref}>{finalLabel}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
