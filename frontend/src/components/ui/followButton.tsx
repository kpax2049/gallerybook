// components/FollowButton.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { follow } from '@/api/follow';

export function FollowButton({
  userId,
  initialIsFollowing,
}: {
  userId: number | undefined;
  initialIsFollowing?: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(!!initialIsFollowing);
  const [loading, setLoading] = useState(false);

  useEffect(() => setIsFollowing(!!initialIsFollowing), [initialIsFollowing]);

  async function toggle() {
    setLoading(true);
    setIsFollowing((v) => !v); // optimistic
    const method = isFollowing ? 'DELETE' : 'POST';
    follow(userId, method)
      .catch(() => {
        setIsFollowing((v) => !v); // revert
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Button
      size="sm"
      variant={isFollowing ? 'secondary' : 'default'}
      onClick={toggle}
      disabled={loading}
    >
      {isFollowing ? 'Following' : 'Follow'}
    </Button>
  );
}
