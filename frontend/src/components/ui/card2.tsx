import { Gallery } from '@/api/gallery';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import React from 'react';

interface Card2Props {
  gallery: Gallery;
  onClick: (gallery: Gallery) => void;
}

const Card2 = React.forwardRef<HTMLDivElement, Card2Props>(
  ({ ...props }, ref) => {
    const { title, description } = props.gallery;
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
          src="/placeholder.svg"
          alt="Card Image"
          width="300"
          height="200"
          className="rounded-t-lg object-cover w-full"
          style={{ aspectRatio: '300/200', objectFit: 'cover' }}
        />
        <CardContent className="p-6 space-y-4">
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  }
);

export default Card2;

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
