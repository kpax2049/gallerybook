import { Gallery } from '@/common/types';
import { useEffect, useState } from 'react';

async function fetchGalleries(): Promise<Gallery[]> {
  const response = await fetch('/api/galleries');
  const data = await response.json();
  return data;
}

export default function GalleryList() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    async function fetchData() {
      try {
        const data = await fetchGalleries();
        setGalleries(data);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          throw error;
        }
      }
    }
    fetchData();
  }, []);
  if (error) {
    return <div>Error: {error}</div>;
  }
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
