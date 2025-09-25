// components/FollowButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { follow } from '@/api/follow';
import { useFollowStore } from '@/stores/followStore';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  userId: number;
  iconOnly?: boolean;
  size?: 'sm' | 'default';
  className?: string;
  onChange?: (isFollowing: boolean) => void;
};

export function FollowButton({
  userId,
  iconOnly = false,
  size = 'sm',
  className,
  onChange,
}: Props) {
  const loaded = useFollowStore((s) => s.loaded);
  const following = useFollowStore((s) => s.ids.has(userId));
  const mark = useFollowStore((s) => s.mark);

  const [pending, setPending] = useState(false);

  // Base variant; for icon mode we color via className so we keep control
  const variant: React.ComponentProps<typeof Button>['variant'] = iconOnly
    ? 'ghost'
    : following
      ? 'secondary'
      : 'default';

  async function toggle() {
    if (!loaded || pending) return;
    setPending(true);
    const next = !following;

    // optimistic write to the store (updates all chips instantly)
    mark(userId, next);
    onChange?.(next);

    const method = next ? 'POST' : 'DELETE';
    follow(userId, method)
      .catch(() => {
        // revert on error
        mark(userId, !next);
        onChange?.(!next);
      })
      .finally(() => {
        setPending(false);
      });
  }

  const label = following ? 'Unfollow user' : 'Follow user';
  const btn = (
    <Button
      size={size}
      variant={variant}
      onClick={toggle}
      disabled={!loaded || pending}
      aria-pressed={following}
      aria-label={iconOnly ? label : undefined}
      className={cn(
        // single style for icon-only mode (uses your exact hex colors)
        iconOnly && 'rounded-full ring-1 ring-border/50',
        iconOnly &&
          (following
            ? 'bg-[#4967ff] text-white hover:bg-[#4967ff]/90 focus-visible:ring-[#4967ff]'
            : 'text-[#2ecaff] hover:bg-[#2ecaff]/15 dark:hover:bg-[#2ecaff]/10 focus-visible:ring-[#2ecaff]'),
        className
      )}
    >
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : iconOnly ? (
        following ? (
          <UserCheck className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )
      ) : following ? (
        'Following'
      ) : (
        'Follow'
      )}
    </Button>
  );

  return iconOnly ? (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{btn}</TooltipTrigger>
        <TooltipContent side="bottom">
          {following ? 'Following' : 'Follow'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ) : (
    btn
  );
}
