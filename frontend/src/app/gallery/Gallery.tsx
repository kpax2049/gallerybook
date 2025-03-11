import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Gallery, getGallery } from '@/api/gallery';
import { TipTapRenderer } from '@/components/ui/TiptapRender';
import CommentPanel from './galleryComment/Comment';

export default function GalleryPage() {
  // { children }: GalleryProps
  const [gallery, setGallery] = useState<Gallery>();
  const [content, setContent] = useState<string>();
  const [loading, setLoading] = useState<boolean>(false);
  const { galleryId } = useParams();
  useEffect(() => {
    setLoading(true);
    getGallery(galleryId).then((data) => {
      setGallery(data);
      if (data.content) {
        setContent(data.content);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="grid auto-rows-min gap-4 p-4 justify-between">
      <h3>Gallery Item: {galleryId}</h3>
      {content && content.length > 0 && (
        <div>
          <TipTapRenderer {...{ content: content }} />
          <CommentPanel />
        </div>
      )}
    </div>
  );
}
