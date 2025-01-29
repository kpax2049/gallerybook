import { Textarea } from '@/components/ui/textarea';

interface GalleryProps {
  children?: string | JSX.Element | JSX.Element[] | (() => JSX.Element);
}
export function Gallery({ ...props }: GalleryProps) {
  return (
    <div>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight p-2">
        New Gallery
      </h3>
      <Textarea className="p-2" />
    </div>
  );
}
