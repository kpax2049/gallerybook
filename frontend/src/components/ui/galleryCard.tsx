import { Gallery } from '@/api/gallery';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface GalleryListCardProps {
  gallery: Gallery;
  onClick: (gallery: Gallery) => void;
}

const GalleryListCard = React.forwardRef<HTMLDivElement, GalleryListCardProps>(
  ({ ...props }, ref) => {
    const { title, description, thumbnail } = props.gallery;
    const { onClick } = props;
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
        <img
          src={thumbnail}
          className="w-full h-full object-cover p-2 rounded-2xl"
        />
        <CardContent className="p-6 space-y-4">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  }
);

export default GalleryListCard;

// const Card1 = React.forwardRef<
//   HTMLDivElement,
//   React.HTMLAttributes<HTMLDivElement>
// >(({ className, ...props }, ref) => (
//   <div
//     ref={ref}
//     className={cn(
//       'rounded-xl border bg-card text-card-foreground shadow',
//       className
//     )}
//     {...props}
//   />
// ));
