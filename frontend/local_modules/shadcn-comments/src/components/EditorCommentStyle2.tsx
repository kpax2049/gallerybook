import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from './Avatar';
import { Input } from './Input';
import { Camera, SendIcon, SmileIcon } from 'lucide-react';
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

interface EditorCommentStyle2Props {
  value?: string;
  onChange?: (val: string) => void;
  currentUser?: User;
}

export const EditorCommentStyle2 = ({
  value = '',
  onChange = () => {},
  currentUser,
}: EditorCommentStyle2Props) => {
  const [tempValue, setTempValue] = useState('');
  const displayName =
    currentUser?.fullName || currentUser?.username || 'You';
  const userInitials = getInitials(currentUser, displayName);
  return (
    <div className={`flex gap-2 w-full items-center`}>
      <Avatar className={'w-[28px] h-[28px]'}>
        <AvatarImage src={currentUser?.profile?.avatarUrl} />
        <AvatarFallback className="bg-[linear-gradient(to_bottom,#4967ff,#2ecaff)] text-white text-xs font-medium uppercase">
          {userInitials}
        </AvatarFallback>
      </Avatar>

      <div className={'w-full flex-1'}>
        <Input
          className={'rounded-md'}
          placeholder={`Reply as ${displayName}`}
          value={tempValue}
          onChange={(v) => setTempValue(v.target.value)}
          onKeyDown={(e) => {
            if (e.code === 'Enter') {
              onChange(tempValue);
              setTempValue('');
            }
          }}
        />
      </div>
    </div>
  );
};
