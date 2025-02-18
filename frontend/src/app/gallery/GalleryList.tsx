import { Gallery, getGalleries } from '@/api/gallery';
import { useEffect, useState } from 'react';

export default function GalleryList() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);

  useEffect(() => {
    // setLoading(true);
    getGalleries().then((data) => {
      setGalleries(data);
      // setLoading(false);
    });
  }, []);

  return (
    <div>
      {galleries.map((gallery) => (
        <div key={gallery.id}>
          <h2>{gallery.title}</h2>
          <p>{gallery.description}</p>
        </div>
      ))}
    </div>
  );
}
