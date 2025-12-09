import { Gallery, getGalleries } from '@/api/gallery';
import GalleryListCard from '@/components/ui/galleryCard';
import { Skeleton } from '@/components/ui/skeleton';
// import { Images } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useGalleryStore } from '@/stores/galleryStore';
// import {
//   // applySortAndFilter,
//   defaultFilters,
//   defaultSort,
//   FilterState,
//   GalleryListToolbar,
//   SortState,
// } from '@/components/ui/GalleryListToolbar';
// import { useUserStore } from '@/stores/userStore';

export default function GalleryList() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  // const [sort, setSort] = useState<SortState>(defaultSort);
  // const [filters, setFilters] = useState<FilterState>({
  //   ...defaultFilters,
  // });
  // const currentUser = useUserStore((state) => state.user);
  // const visible = useMemo(
  //   () => applySortAndFilter(galleries, sort, filters, currentUser?.id),
  //   [galleries, sort, filters]
  // );

  useEffect(() => {
    setLoading(true);
    getGalleries().then((data) => {
      setGalleries(data);
      useGalleryStore.getState().setGalleries(data);
      setLoading(false);
    });
  }, []);

  const GallerySkeleton = () => {
    const skeletons = [];
    for (let step = 0; step < 6; step++) {
      skeletons.push(
        <div key={step} className="flex flex-col space-y-3">
          <Skeleton className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted" />
        </div>
      );
    }
    return skeletons;
  };
  const onClick = (gallery: Gallery) => {
    console.info(gallery);
  };

  return (
    <div className="grid auto-rows-min gap-4 p-4 md:grid-cols-3 justify-between">
      {/* <GalleryListToolbar
        sort={sort}
        filters={filters}
        onSortChange={setSort}
        onFiltersChange={setFilters}
        availableTags={['travel', 'family', 'pets', 'architecture', 'food']}
        resultCount={visible.length}
      /> */}
      {!loading ? (
        galleries.map((gallery) => (
          <div key={gallery.id}>
            <NavLink viewTransition to={gallery.id.toString()}>
              <GalleryListCard {...{ gallery, onClick }} />
            </NavLink>
          </div>
          // <div
          //   key={gallery.id}
          //   className="flex items-center flex-col p-4 gap-2 aspect-video rounded-xl bg-muted"
          // >
          //   <h2>{gallery.title}</h2>
          //   <Images className="h-100 w-100 flex-grow" />
          //   <p>{gallery.description}</p>
          // </div>
        ))
      ) : (
        <GallerySkeleton />
      )}
    </div>
  );
}
