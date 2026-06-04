// CommentSection.tsx
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { ArrowUpIcon, CircleIcon, SmileIcon } from 'lucide-react';
import { EditorComment } from './EditorComment';
import {
  ACTIONS,
  ACTIONS_TYPE,
  CreateCommentRequest,
  Comment,
} from '../types/comment';
import { EditorCommentStyle2 } from './EditorCommentStyle2';
import { MDXProvider } from '@mdx-js/react';
import PreviewComment from './PreviewComment';
import { formatDistance } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from './Popover';
import EmojiSelect from './EmojiSelect';
import { DropdownMenu } from './DropdownMenu';
import { EditingEditorComment } from './EditingEditorComment';
import { User } from '../types/user';

const getInitials = (
  user?: Pick<User, 'fullName' | 'username'>,
  fallbackName?: string
) => {
  const name = user?.fullName || user?.username || fallbackName || '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  if (letters) return letters;

  const fallback = (fallbackName ?? '').trim();
  return fallback ? fallback.slice(0, 2).toUpperCase() : '?';
};

interface CommentProps {
  className?: string;
  isMdxEditor?: boolean;
  formatDate?: string;
  value: Comment[];
  currentUser?: User;
  galleryId: number;
  onChange?: (value: Comment[]) => void;
  onReply?: (value: CreateCommentRequest) => void;
  theme: 'light' | 'dark' | 'system';
  allowUpVote?: boolean;
  onReact?: (
    commentId: number,
    type: ACTIONS_TYPE,
    nextSelected: boolean
  ) => void;
}

interface CommentCardProps {
  comment: Comment;
  onReply: (val: string) => void;
  currentUser?: User;
  allowUpVote?: boolean;
  onChange: (change: any) => void;
  onDelete: () => void;
  onReact: (type: ACTIONS_TYPE, nextSelected: boolean) => void;
  theme: 'light' | 'dark' | 'system';
}

export const CommentCard = ({
  comment,
  onReply = () => {},
  currentUser,
  allowUpVote,
  onChange,
  onReact,
  theme,
  onDelete,
}: CommentCardProps) => {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);

  // TS-friendly read of actions (string-enum keys)
  const actionsMap =
    (comment.actions as Record<string, number> | undefined) ?? undefined;

  const actions = ACTIONS.filter((e) => {
    const count = actionsMap?.[e.id] ?? 0;
    return count > 0;
  });

  const author = comment.user;
  const authorName = author?.fullName || author?.username || 'Unknown user';
  const authorAvatar = author?.profile?.avatarUrl;
  const authorInitials = getInitials(author, authorName);

  const upvote = (comment.actions ?? {})[ACTIONS_TYPE.UPVOTE];
  const upvoted = comment.selectedActions?.includes(ACTIONS_TYPE.UPVOTE);

  return (
    <div className="flex flex-col gap-1" id={`comment-${comment.id}`}>
      <div className="flex gap-4">
        <Avatar className="w-[32px] h-[32px] ring-1 ring-border/60 overflow-hidden">
          <AvatarImage src={authorAvatar} />
          {/* Gradient background for initials */}
          <AvatarFallback className="bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white font-medium">
            {authorInitials}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col w-full">
          {/* Card (neutral background) */}
          <div className="relative min-h-[30px] rounded-md border border-border/70 bg-card/70 shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="relative h-10 w-full rounded-t-md flex items-center justify-between px-3 bg-background/40">
              <div className="flex items-center gap-2">
                {/* Author (NO underline now) */}
                <span className="inline-block font-semibold tracking-tight">
                  {authorName}
                </span>

                {comment.createdAt && (
                  <span className="text-xs text-muted-foreground/80">
                    {formatDistance(Date.now(), comment.createdAt, {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>

              <DropdownMenu
                comment={comment}
                currentUser={currentUser}
                openEditor={() => setEditing(true)}
                deleteComment={onDelete}
              />

              {/* Gradient separator replacing border-b (subtle) */}
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-[#4967ff]/30 to-[#2ecaff]/30" />
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              {editing ? (
                <EditingEditorComment
                  currentUser={currentUser}
                  theme={theme}
                  value={comment.text}
                  onChange={(val) => {
                    onChange({ text: val });
                    setEditing(false);
                  }}
                />
              ) : (
                <PreviewComment source={comment.text} />
              )}
            </div>

            {/* Footer actions */}
            {allowUpVote && !editing && (
              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-sm px-3 pb-3">
                {/* Upvote */}
                <div
                  onClick={() => {
                    const currentAmount = (comment.actions || {})[
                      ACTIONS_TYPE.UPVOTE
                    ];
                    onReact(
                      ACTIONS_TYPE.UPVOTE,
                      upvoted ? false : true
                    );
                    if (upvoted) {
                      if (currentAmount)
                        onChange({
                          selectedActions: comment.selectedActions?.filter(
                            (e) => e !== ACTIONS_TYPE.UPVOTE
                          ),
                          actions: {
                            ...(comment.actions || {}),
                            [ACTIONS_TYPE.UPVOTE]: currentAmount - 1,
                          },
                        });
                    } else {
                      onChange({
                        selectedActions: [
                          ...(comment.selectedActions ?? []),
                          ACTIONS_TYPE.UPVOTE,
                        ],
                        actions: {
                          ...(comment.actions || {}),
                          [ACTIONS_TYPE.UPVOTE]: currentAmount
                            ? currentAmount + 1
                            : 1,
                        },
                      });
                    }
                  }}
                  className={[
                    'inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm cursor-pointer',
                    'active:scale-[0.98] transition-all',
                    upvoted
                      ? // Gradient only when active
                        'text-white border-transparent ring-0 shadow ' +
                        'bg-[linear-gradient(to_bottom,rgba(73,103,255,.85),rgba(46,202,255,.85))]'
                      : 'border-border/70 hover:bg-accent',
                  ].join(' ')}
                >
                  <ArrowUpIcon size={16} />
                  <span>{upvote ?? 0}</span>
                </div>

                {/* Emoji */}
                <Popover>
                  <PopoverTrigger asChild>
                    <div
                      className={[
                        'inline-flex h-8 w-8 items-center justify-center',
                        'rounded-md border border-border/70 hover:bg-accent cursor-pointer',
                        'active:scale-[0.98] transition-all',
                      ].join(' ')}
                    >
                      <SmileIcon size={16} />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="p-0.5" align="start">
                    <EmojiSelect
                      value={comment.selectedActions}
                      onSelect={(v, changeValue: ACTIONS_TYPE) => {
                        const selected = v as ACTIONS_TYPE[]; // picker -> enum array
                        const currentAmount =
                          (comment.actions || {})[changeValue] ?? 0;
                        onReact(changeValue, true);
                        onChange({
                          selectedActions: selected,
                          actions: {
                            ...(comment.actions || {}),
                            [changeValue]: currentAmount + 1,
                          },
                        });
                      }}
                      onUnSelect={(v, changeValue: ACTIONS_TYPE) => {
                        const selected = (v as string[]).filter(
                          (f) => f !== changeValue
                        ) as ACTIONS_TYPE[];
                        const currentAmount =
                          (comment.actions || {})[changeValue] ?? 0;
                        onReact(changeValue, false);
                        onChange({
                          selectedActions: selected,
                          actions: {
                            ...(comment.actions || {}),
                            [changeValue]: Math.max(0, currentAmount - 1),
                          },
                        });
                      }}
                      className=""
                    />
                  </PopoverContent>
                </Popover>

                {/* Active reactions (no gradient underline now) */}
                {actions?.map((e) => (
                  <div
                    key={e.id}
                    className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm border-border/60"
                  >
                    <span>{e.emoji}</span>
                    <span>{(comment.actions ?? {})[e.id]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reply/meta row */}
          <div className="ml-1 mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className="cursor-pointer font-semibold text-[#4967ff] hover:underline"
              onClick={() => setReplying(true)}
            >
              Reply
            </span>
            <CircleIcon size={3} />
            <span className="opacity-80">
              {comment.createdAt &&
                formatDistance(Date.now(), comment.createdAt, {
                  addSuffix: true,
                })}
            </span>
          </div>
        </div>
      </div>

      {/* Inline reply editor */}
      {replying ? (
        <div className="ml-[48px]">
          <EditorCommentStyle2 onChange={onReply} currentUser={currentUser} />
        </div>
      ) : null}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 ? (
        <div className="ml-[48px] flex flex-col gap-3 border-l-2 border-dashed border-border/60 pl-3 md:pl-4">
          {comment.replies.map((rep) => {
            const replyUser = rep.user;
            const replyAvatar = replyUser?.profile?.avatarUrl;
            const replyName =
              replyUser?.fullName || replyUser?.username || 'Unknown user';
            const replyInitials = getInitials(replyUser, replyName);

            return (
              <div className="w-full flex gap-2 relative" key={rep.id}>
                {/* subtle neutral dot */}
                <span className="absolute -left-[9px] top-3 hidden h-2 w-2 rounded-full bg-border md:block" />
                <Avatar className="w-[28px] h-[28px] text-sm ring-1 ring-border/60 overflow-hidden">
                  <AvatarImage src={replyAvatar} />
                  {/* Gradient initials in replies too */}
                  <AvatarFallback className="bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white font-medium">
                    {replyInitials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {rep.text}
                  </div>
                  <div className="inline-flex gap-2 text-xs text-muted-foreground">
                    <div className="font-medium text-foreground/90">
                      {rep.user?.fullName || rep.user?.username}
                    </div>
                    <div className="opacity-80">
                      {rep.createdAt &&
                        formatDistance(Date.now(), rep.createdAt, {
                          addSuffix: true,
                        })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};

export const CommentSection = ({
  className = '',
  formatDate,
  isMdxEditor = true,
  value,
  onChange = () => {},
  onReply = () => {},
  theme = 'light',
  currentUser,
  galleryId,
  allowUpVote = false,
  onReact = () => {},
}: CommentProps) => {
  return (
    <MDXProvider
      components={{
        wrapper(props) {
          // Neutral wrapper — no card-wide gradient
          return (
            <div
              className="rounded-md border border-border/60 bg-card/60 p-2"
              {...props}
            />
          );
        },
      }}
    >
      <div
        className={`max-w-screen-md flex flex-col gap-4 w-full ${className}`}
      >
        {isMdxEditor && (
          <EditorComment
            currentUser={currentUser}
            theme={theme}
            onChange={(val) => {}}
          />
        )}
        {value.map((e) => (
          <CommentCard
            currentUser={currentUser}
            onReply={(rep) => {
              if (value) {
                onReply({
                  parentId: e.id,
                  userId: currentUser?.id,
                  text: rep,
                  galleryId,
                });
              }
            }}
          onChange={(change: any) => {
            if (value)
              onChange(
                value.map((f) => (f.id === e.id ? { ...f, ...change } : f))
              );
          }}
            onDelete={() => {
              onChange(value.filter((f) => f.id !== e.id));
            }}
            comment={e}
            key={e.id}
            allowUpVote={allowUpVote}
            theme={theme}
            onReact={(type, nextSelected) =>
              onReact(e.id, type, nextSelected)
            }
          />
        ))}
      </div>
    </MDXProvider>
  );
};
