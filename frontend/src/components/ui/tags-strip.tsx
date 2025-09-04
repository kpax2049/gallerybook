import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from '@/components/ui/hover-card';
import { cn } from '@/lib/utils';

type Props = {
  tags?: string[];
  maxVisible?: number; // how many chips to show inline
  className?: string;
  dense?: boolean; // slightly smaller paddings
};

export function TagStrip({
  tags = [],
  maxVisible = 3,
  className,
  dense,
}: Props) {
  if (!tags.length) {
    return (
      <div className={cn('text-[11px] text-muted-foreground', className)}>
        No tags
      </div>
    );
  }

  const visible = tags.slice(0, maxVisible);
  const overflow = Math.max(0, tags.length - visible.length);

  const badgeClass = cn(
    'shrink-0 max-w-[45%]',
    dense ? 'px-1.5 py-0.5 text-[10.5px]' : ''
  );

  return (
    <div
      className={cn(
        'flex h-[28px] min-w-0 items-center gap-1 overflow-hidden',
        className
      )}
    >
      {visible.map((t) => (
        <Badge key={t} variant="secondary" className={badgeClass} title={t}>
          <span className="block max-w-full truncate">{t}</span>
        </Badge>
      ))}

      {overflow > 0 && (
        <HoverCard openDelay={80}>
          <HoverCardTrigger asChild>
            <Badge variant="outline" className={badgeClass}>
              +{overflow}
            </Badge>
          </HoverCardTrigger>
          <HoverCardContent
            align="end"
            side="top"
            sideOffset={8}
            className="z-[1100] w-[min(320px,85vw)]"
          >
            <div className="text-xs mb-2 text-muted-foreground">All tags</div>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="max-w-full">
                  <span className="truncate">{t}</span>
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      )}
    </div>
  );
}
