import { Author } from '@/api/gallery';
import { FollowButton } from '@/components/ui/followButton';
import * as React from 'react';
import { Link } from 'react-router-dom';

type Props = {
  user: Author;
  size?: 'sm' | 'md';
  showFollow?: boolean;
  currentUserId?: number;
  className?: string;
  /** Set true when the chip is rendered inside a clickable card Link */
  insideClickableCard?: boolean;
};

export function UserChip({
  user,
  size = 'sm',
  showFollow = false,
  currentUserId,
  className = '',
  insideClickableCard = false,
}: Props) {
  const chipClasses = [
    'inline-flex items-center gap-2 rounded-full border px-2 py-1',
    'bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60',
    'shadow-sm text-xs transition-colors hover:bg-accent',
    size === 'md' ? 'text-sm px-3 py-1.5' : '',
    className,
  ].join(' ');

  const avatarClasses = size === 'md' ? 'h-8 w-8' : 'h-6 w-6';
  const isFollowing = false;
  // Prevent card click when interacting with the chip
  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const content = (
    <>
      <img
        src={user.avatarUrl || '/avatar-fallback.png'}
        alt=""
        className={`${avatarClasses} rounded-full object-cover flex-shrink-0`}
      />
      <span className="truncate max-w-[12rem]">{user.displayName}</span>
    </>
  );

  return (
    <div
      className={chipClasses}
      onClick={insideClickableCard ? stop : undefined}
    >
      {insideClickableCard ? (
        <div className="flex items-center gap-2 min-w-0">{content}</div>
      ) : (
        <Link
          to={`/users/${user.id}`}
          className="flex items-center gap-2 min-w-0"
        >
          {content}
        </Link>
      )}
      {showFollow && user.id !== currentUserId && (
        <div onClick={stop}>
          <FollowButton userId={user.id} initialIsFollowing={isFollowing} />
        </div>
      )}
    </div>
  );
}
