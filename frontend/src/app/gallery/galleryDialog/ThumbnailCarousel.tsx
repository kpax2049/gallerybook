import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import { useThumbStore } from '@/stores/thumbStore';

export function ThumbnailCarousel({
  images,
}: {
  images: { src: string; alt?: string }[];
}) {
  const [api, setApi] = React.useState<CarouselApi>();
  const setIndex = useThumbStore((s) => s.setIndex);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [idx, setIdx] = React.useState(0);

  return (
    <div>
      <Carousel className="w-full max-w-xs flex-col mx-auto" setApi={setApi}>
        <CarouselContent>
          {images.map((img, idx) => (
            <CarouselItem key={idx}>
              <div className="p-1">
                <Card>
                  <CardContent className="relative aspect-square w-full p-0">
                    <img
                      src={img.src}
                      alt={img.alt ?? ''}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            setIdx((prev) => {
              const nextIdx = Math.max(0, prev - 1);
              if (nextIdx !== prev) {
                api?.scrollTo(nextIdx);
                setIndex(nextIdx);
              }

              return nextIdx;
            });
          }}
        />
        <CarouselNext
          type="button"
          onClick={(e: React.MouseEvent) => {
            e.preventDefault();
            setIdx((prev) => {
              const max = images.length - 1;
              const nextIdx = Math.min(max, prev + 1);
              if (nextIdx !== prev) {
                api?.scrollTo(nextIdx);
                setIndex(nextIdx);
              }

              return nextIdx;
            });
          }}
        />
      </Carousel>
    </div>
  );
}
