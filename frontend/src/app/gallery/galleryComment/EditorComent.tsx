import { useEffect, useState } from 'react';
import { MDXEditor } from '@mdxeditor/editor';

import { Avatar, AvatarImage, AvatarFallback, Button } from 'shadcn-comments';
import { User } from 'shadcn-comments/dist/types/user';

interface EditorCommentProps {
  value?: string;
  onChange?: (val: string) => void;
  placeholder?: string;
  theme: 'light' | 'dark' | 'system';
  currentUser: User;
}

export const EditorComment = ({
  value = '',
  onChange = () => {},
  placeholder = 'Add your comment here...',
  theme,
  currentUser = {
    id: '1',
    userProfile: '',
    fullName: 'Me',
    avatarUrl: 'https://github.com/shadcn.png',
  },
}: EditorCommentProps) => {
  const [tempValue, setTempValue] = useState('');

  useEffect(() => {
    setTempValue(value);
  }, [value]);

  return (
    <div className={`flex flex-col gap-2 w-full editor-content-container`}>
      <div className={`flex gap-4 w-full`}>
        <Avatar className={'w-[32px] h-[32px]'}>
          <AvatarImage src={currentUser?.avatarUrl} />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>

        <div className={'w-full flex-1'}>
          <MDXEditor
            markdown={tempValue}
            onChange={setTempValue}
            placeholder={placeholder}
            className={`border rounded-lg prose-sm md:prose max-w-full editor-content ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
            contentEditableClassName={`overflow-y-auto py-2 whitespace-normal text-start`}
          />
        </div>
      </div>
      <div className={'flex justify-end'}>
        <Button
          disabled={!tempValue}
          onClick={() => {
            onChange(tempValue);
            setTempValue('');
          }}
          className={'h-8'}
        >
          Comment
        </Button>
      </div>
    </div>
  );
};
