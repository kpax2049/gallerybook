import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { CommentSection } from 'shadcn-comments';
import { CommentEditor } from './CommentEditor';
import {
  Comment,
  createComment,
  CreateCommentRequest,
  getComments,
} from '@/api/comment';
import { useUserStore } from '@/stores/userStore';

interface CommentProps {
  galleryId: number;
}

export default function CommentList({ galleryId }: CommentProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState<Comment[]>([]);
  const currentUser = useUserStore((state) => state.user);

  useEffect(() => {
    // setLoading(true);
    getComments(galleryId).then((data) => {
      setValue(data);
      // setLoading(false);
    });
  }, []);

  const onChange = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      setValue([...value, data]);
    });
  };

  const onReply = (val: CreateCommentRequest) => {
    createComment(val).then((data: Comment) => {
      //TODO: replace new object with Comment returned from backend
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
