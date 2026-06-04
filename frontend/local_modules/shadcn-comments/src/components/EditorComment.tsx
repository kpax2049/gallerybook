import React, { useEffect, useMemo, useState } from 'react';
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  CreateLink,
  headingsPlugin,
  imagePlugin,
  InsertImage,
  InsertTable,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from '@mdxeditor/editor';
import { Button } from './Button';
import { User } from '../types/user';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { cn } from '../lib/utils';

interface EditorCommentProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  onUpload?: (image: File) => Promise<string>;
  theme: 'light' | 'dark' | 'system';
  currentUser?: User;
}

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

export const EditorComment = ({
  value = '',
  onChange = () => {},
  placeholder = 'Add your comment here...',
  onUpload,
  theme,
  currentUser,
}: EditorCommentProps) => {
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  const currentName = currentUser?.fullName || currentUser?.username || 'You';
  const initials = getInitials(currentUser, currentName);

  return (
    <div className="editor-content-container flex w-full flex-col gap-2">
      <div className="flex w-full gap-3">
        <Avatar className="h-8 w-8 ring-1 ring-border/60">
          <AvatarImage src={currentUser?.profile?.avatarUrl} />
          <AvatarFallback className="bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white text-xs font-medium uppercase">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="w-full flex-1">
          <MDXEditor
            markdown={tempValue}
            onChange={setTempValue}
            placeholder={placeholder}
            className={cn(
              'editor-content prose-sm md:prose max-w-full rounded-xl border border-border/60 bg-background/80',
              'focus-within:ring-2 focus-within:ring-primary/40',
              theme === 'dark' ? 'dark-theme' : 'light-theme'
            )}
            contentEditableClassName="overflow-y-auto whitespace-normal text-start py-2 px-3"
            plugins={[
              toolbarPlugin({
                toolbarContents: () => (
                  <div className="flex flex-wrap items-center gap-1 p-1">
                    <UndoRedo />
                    <ListsToggle />
                    <Separator />
                    <InsertImage />
                    <div className="hidden gap-1 md:flex">
                      <BoldItalicUnderlineToggles />
                      <BlockTypeSelect />
                      <CreateLink />
                      <InsertTable />
                    </div>
                  </div>
                ),
              }),
              headingsPlugin(),
              listsPlugin(),
              quotePlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
              tablePlugin(),
              imagePlugin({ imageUploadHandler: onUpload }),
              linkPlugin(),
              linkDialogPlugin(),
            ]}
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          disabled={!tempValue}
          onClick={() => {
            onChange(tempValue);
            setTempValue('');
          }}
          className="h-8"
        >
          Comment
        </Button>
      </div>
    </div>
  );
};
