import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { CommentSection, ACTIONS_TYPE } from 'shadcn-comments';
import { CommentEditor } from './CommentEditor';
import {
  Comment,
  createComment,
  CreateCommentRequest,
  getComments,
} from '@/api/comment';
import { UserRole } from '@/common/enums';

interface CommentProps {
  galleryId: number;
}

export default function CommentList({ galleryId }: CommentProps) {
  const { theme } = useTheme();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [value, setValue] = useState<any[]>([]);

  useEffect(() => {
    // setLoading(true);
    getComments(galleryId).then((data) => {
      setValue(data);
      // setLoading(false);
    });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      setValue([...value, data]);
    });
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onReply = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      //TODO: replace new object with Comment returnted from backend
      setValue(
        value.map((f) =>
          f.id === val.parentId
            ? {
                ...f,
                replies: [data, ...(f.replies ?? [])],
              }
            : f
        )
      );
    });
  };

  return (
    <div className={`flex align-center justify-start flex-col  p-3 md:p-4`}>
      <div className={`max-w-screen-md flex flex-col gap-2 w-full`}>
        <CommentEditor
          currentUser={{
            id: 22,
            firstName: 'K',
            lastName: 'P',
            email: 'kpax@live.com',
            role: UserRole.ADMIN,
          }}
          theme={theme}
          onChange={(val) => {
            onChange({
              text: val,
              galleryId: Number(galleryId),
              userId: 22,
            });
          }}
        />
        <CommentSection
          theme={theme}
          currentUser={{
            id: 22,
            firstName: 'K',
            lastName: 'P',
            email: 'kpax@live.com',
            // role: UserRole.ADMIN,
          }}
          value={value}
          onChange={() => {}}
          onReply={onReply}
          isMdxEditor={false}
          allowUpVote={true}
          galleryId={galleryId}
        />
      </div>
    </div>
  );
}
