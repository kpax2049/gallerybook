import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useGalleryStore } from '@/stores/galleryStore';

export function GalleryBreadcrumb() {
  const location = useLocation();
  const { galleryId } = useParams();
  const getGalleryById = useGalleryStore((state) => state.getGalleryById);

  const isCreating = location.pathname.endsWith('/new');
  const isEditing = location.pathname.endsWith('/edit');
  const basePath = '/galleries';

  const gallery = galleryId ? getGalleryById(Number(galleryId)) : undefined;

  let finalLabel = 'Gallery';
  let finalHref = '#';

  if (isCreating) {
    finalLabel = 'Create New Gallery';
    finalHref = `${basePath}/new`;
  } else if (isEditing && galleryId) {
    finalLabel = `Editing ${gallery?.title || galleryId}`;
    finalHref = `${basePath}/${galleryId}/edit`;
  } else if (galleryId) {
    finalLabel = gallery?.title || galleryId;
    finalHref = `${basePath}/${galleryId}`;
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
