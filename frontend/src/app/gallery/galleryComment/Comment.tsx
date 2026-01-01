import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { CommentSection } from 'shadcn-comments';
import { CommentEditor } from './CommentEditor';
import {
  Comment,
  createComment,
  CreateCommentRequest,
  getComments,
  toggleCommentReaction,
  ACTIONS_TYPE,
} from '@/api/comment';
import { useUserStore } from '@/stores/userStore';
import type { Comment as UiComment } from 'shadcn-comments';
import { UserRole } from '@/common/enums';
import type { User } from '@/api/user';

interface CommentProps {
  galleryId: number;
}

export default function CommentList({ galleryId }: CommentProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState<Comment[]>([]);
  const currentUser = useUserStore((state) => state.user);

  const emptyActions = () => ({
    [ACTIONS_TYPE.THUMB_UP]: 0,
    [ACTIONS_TYPE.THUMB_DOWN]: 0,
    [ACTIONS_TYPE.LAUGH]: 0,
    [ACTIONS_TYPE.HOORAY]: 0,
    [ACTIONS_TYPE.CONFUSED]: 0,
    [ACTIONS_TYPE.HEART]: 0,
    [ACTIONS_TYPE.ROCKET]: 0,
    [ACTIONS_TYPE.EYE]: 0,
    [ACTIONS_TYPE.UPVOTE]: 0,
  });

  type UiUser = UiComment['user'];

  const toAppUser = (user?: UiUser | User): User | undefined => {
    if (!user) return undefined;
    return {
      role: (user as User).role ?? UserRole.USER,
      status: (user as User).status,
      hash: (user as User).hash,
      settings: (user as User).settings,
      galleries: (user as User).galleries,
      id: user.id,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      profile: user.profile,
    };
  };

  const normalizeComment = (comment: Comment | UiComment): Comment => ({
    ...(comment as Comment),
    user: toAppUser((comment as Comment).user ?? comment.user),
    actions: { ...emptyActions(), ...(comment.actions ?? {}) },
    selectedActions: comment.selectedActions ?? [],
    replies: comment.replies?.map(normalizeComment) ?? [],
  });

  const updateCommentById = (
    list: Comment[],
    id: number,
    updater: (c: Comment) => Comment
  ): Comment[] => {
    return list.map((c) => {
      if (c.id === id) return updater(c);
      if (c.replies?.length) {
        const nextReplies = updateCommentById(c.replies, id, updater);
        if (nextReplies !== c.replies) return { ...c, replies: nextReplies };
      }
      return c;
    });
  };

  useEffect(() => {
    getComments(galleryId).then((data) => {
      setValue(data.map(normalizeComment));
    });
  }, [galleryId]);

  const onChange = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      const normalized = normalizeComment(data);
      setValue((prev) => [...prev, normalized]);
    });
  };

  const onReply = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      const normalized = normalizeComment(data);
      setValue((prev) =>
        prev.map((f) =>
          f.id === val.parentId
            ? {
                ...f,
                replies: [normalized, ...(f.replies ?? [])],
              }
            : f
        )
      );
    });
  };

  const onReact = async (
    commentId: number,
    type: ACTIONS_TYPE,
    nextSelected: boolean
  ) => {
    // optimistic update
    setValue((prev) =>
      updateCommentById(prev, commentId, (c) => {
        const current = c.actions?.[type] ?? 0;
        const desired = nextSelected ?? !(c.selectedActions ?? []).includes(type);
        const delta = desired ? 1 : -1;
        const nextActions = { ...emptyActions(), ...(c.actions ?? {}) };
        nextActions[type] = Math.max(0, current + delta);
        const selected = c.selectedActions ?? [];
        const nextSelectedList = desired
          ? Array.from(new Set([...selected, type]))
          : selected.filter((t) => t !== type);
        return { ...c, actions: nextActions, selectedActions: nextSelectedList };
      })
    );

    try {
      const res = await toggleCommentReaction(commentId, type);
      setValue((prev) =>
        updateCommentById(prev, commentId, (c) => ({
          ...c,
          actions: { ...emptyActions(), ...res.actions },
          selectedActions: res.selectedActions ?? [],
        }))
      );
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  return (
    <div className={`flex align-center justify-start flex-col  p-3 md:p-4`}>
      <div className={`max-w-screen-md flex flex-col gap-2 w-full`}>
        <CommentEditor
          currentUser={currentUser}
          theme={theme}
          onChange={(val) => {
            onChange({
              text: val,
              galleryId: Number(galleryId),
              userId: currentUser?.id,
            });
          }}
        />
        <CommentSection
          theme={theme}
          currentUser={currentUser}
          value={value}
          onReply={onReply}
          isMdxEditor={false}
          allowUpVote={true}
          galleryId={galleryId}
          onReact={onReact}
          onChange={(comments) => setValue(comments.map(normalizeComment))}
        />
      </div>
    </div>
  );
}
