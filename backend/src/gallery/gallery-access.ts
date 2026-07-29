import { GalleryStatus, Role, Visibility } from '@prisma/client';

type ReadableGallery = {
  status: GalleryStatus;
  visibility: Visibility;
};

type GalleryReader = {
  role: Role;
};

export function canReadGallery(gallery: ReadableGallery, user?: GalleryReader) {
  return (
    user?.role === Role.ADMIN ||
    (gallery.status === GalleryStatus.PUBLISHED &&
      gallery.visibility !== Visibility.PRIVATE)
  );
}
