import { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { CommentSection, ACTIONS_TYPE } from 'shadcn-comments';
import { EditorComment } from './EditorComent';
import { createComment, getComments } from '@/api/comment';

interface CommentProps {
  galleryId: string | undefined;
}
// [
//   {
//     user: {
//       id: '1',
//       userProfile: '',
//       fullName: 'victorcesae',
//       avatarUrl: '',
//     },
//     id: '2',
//     text: 'Another utility is to add text adornments, doing some simple typechecking so if a string is passed you can style a background, else render the react node.',
//     replies: [],
//     createdAt: new Date('2024-06-01'),
//     selectedActions: [
//       ACTIONS_TYPE.UPVOTE,
//       ACTIONS_TYPE.ROCKET,
//       ACTIONS_TYPE.HEART,
//     ],
//     actions: {
//       [ACTIONS_TYPE.UPVOTE]: 1,
//       [ACTIONS_TYPE.ROCKET]: 10,
//       [ACTIONS_TYPE.HEART]: 10,
//     },
//   },
//   {
//     user: {
//       id: '4',
//       userProfile: '',
//       fullName: 'UltimateGG',
//       avatarUrl: '',
//     },
//     id: '3',
//     text: 'Another utility is to add text adornments, doing some simple typechecking so if a string is passed you can style a background, else render the react node.',
//     replies: [
//       {
//         user: {
//           id: '4',
//           userProfile: '',
//           fullName: 'UltimateGG',
//           avatarUrl: '',
//         },
//         id: '8',
//         text: 'Another utility is to add text adornments',
//         replies: [],
//         createdAt: new Date('2024-09-02'),
//       },
//     ],
//     createdAt: new Date('2024-09-01'),
//   },
// ];
export default function Comment({ galleryId }: CommentProps) {
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

  function makeid(length: number) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz'.toUpperCase();
    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
      counter += 1;
    }
    return result;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onChange = (val: any) => {
    setValue(val);

    createComment({
      text: val[0].text,
      userId: 22,
      galleryId: galleryId,
    });
  };

  return (
    <div className={`flex align-center justify-start flex-col  p-3 md:p-4`}>
      <div className={`max-w-screen-md flex flex-col gap-2 w-full`}>
        <EditorComment
          currentUser={{
            id: '1',
            userProfile: '',
            fullName: 'Me',
            avatarUrl: 'https://github.com/shadcn.png',
          }}
          theme={theme}
          onChange={(val) => {
            onChange([
              {
                id: makeid(8),
                user: {
                  id: '1',
                  userProfile: '',
                  fullName: 'Me',
                  avatarUrl: 'https://github.com/shadcn.png',
                },
                createdAt: new Date(),
                replies: [],
                text: val,
              },
              ...(value ?? []),
            ]);
          }}
        />
        <CommentSection
          theme={theme}
          currentUser={{
            id: '1',
            userProfile: '',
            fullName: 'Me',
            avatarUrl: 'https://github.com/shadcn.png',
          }}
          value={value}
          onChange={(val) => {
            // eslint-disable-next-line no-debugger
            debugger;
            setValue(val);
          }}
          className={'hide-mxeditor'}
          allowUpVote={true}
        />
      </div>
    </div>
  );
}
