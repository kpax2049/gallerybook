import { deleteGallery, Gallery } from '@/api/gallery';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';
import { ThreeDotMenu } from '../three-dot-menu';
import { useNavigate } from 'react-router-dom';

interface GalleryListCardProps {
  gallery: Gallery;
  onClick: (gallery: Gallery) => void;
}

const GalleryListCard = React.forwardRef<HTMLDivElement, GalleryListCardProps>(
  ({ ...props }, ref) => {
    const { title, description, thumbnail } = props.gallery;
    const { onClick } = props;
    const navigate = useNavigate();

    const onEdit = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e && e.stopPropagation) e.stopPropagation();
      navigate(`/galleries/edit/${props.gallery.id}`);
    };

    const onDelete = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (e && e.stopPropagation) e.stopPropagation();
      deleteGallery(props.gallery.id);
    };

    return (
      <Card
        ref={ref}
        className={cn(
          'w-full max-w-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer'
        )}
        onClick={() => {
          onClick(props.gallery);
        }}
      >
        {/* {...props} */}
        <div className="relative">
          <img
            src={thumbnail}
            width="400"
            height="200"
            className="rounded-t-lg object-cover"
            style={{ aspectRatio: '400/200', objectFit: 'cover' }}
            // className="w-full h-full object-cover p-2 rounded-2xl"
          />
          <ThreeDotMenu onEdit={onEdit} onDelete={onDelete} />
        </div>
        <CardContent className="p-6 space-y-4">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  }
);

export default GalleryListCard;
