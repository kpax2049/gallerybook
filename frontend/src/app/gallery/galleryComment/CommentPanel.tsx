import { Gallery } from '@/api/gallery';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import EmojiSelect from '@/components/ui/emojiSelect';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { ACTIONS, ACTIONS_TYPE } from '@/types/comment';
import { ArrowUpIcon, SmileIcon } from 'lucide-react';
import React, { useState } from 'react';

interface CommentPanelProps {
  gallery?: Gallery;
}

const CommentPanel = React.forwardRef<HTMLDivElement, CommentPanelProps>(
  ({ ...props }, ref) => {
    console.info(props, ref);
    // const [replying, setReplying] = useState(false);
    const [editing, setEditing] = useState(false);
    const [allowUpVote, setAllowUpvote] = useState(true);
    const [value, setValue] = useState<any[]>([
      {
        user: {
          id: '1',
          userProfile: '',
          fullName: 'victorcesae',
          avatarUrl: '',
        },
        id: '2',
        text: 'Another utility is to add text adornments, doing some simple typechecking so if a string is passed you can style a background, else render the react node.',
        replies: [],
        createdAt: new Date('2024-06-01'),
        selectedActions: [
          ACTIONS_TYPE.UPVOTE,
          ACTIONS_TYPE.ROCKET,
          ACTIONS_TYPE.HEART,
        ],
        actions: {
          [ACTIONS_TYPE.UPVOTE]: 1,
          [ACTIONS_TYPE.ROCKET]: 10,
          [ACTIONS_TYPE.HEART]: 10,
        },
      },
      {
        user: {
          id: '4',
          userProfile: '',
          fullName: 'UltimateGG',
          avatarUrl: '',
        },
        id: '3',
        text: 'Another utility is to add text adornments, doing some simple typechecking so if a string is passed you can style a background, else render the react node.',
        replies: [
          {
            user: {
              id: '4',
              userProfile: '',
              fullName: 'UltimateGG',
              avatarUrl: '',
            },
            id: '8',
            text: 'Another utility is to add text adornments',
            replies: [],
            createdAt: new Date('2024-09-02'),
          },
        ],
        createdAt: new Date('2024-09-01'),
      },
    ]);
    const comment = value[0];
    const actions = ACTIONS.filter(
      (e) =>
        comment.actions &&
        comment.actions[e.id] &&
        comment.selectedActions?.includes(e.id)
    );

    const upvote = (comment.actions ?? {})[ACTIONS_TYPE.UPVOTE];

    const upvoted = comment.selectedActions?.includes(ACTIONS_TYPE.UPVOTE);
    return (
      <div className="w-full mx-auto space-y-6 gap-4 p-4 mt-6 border-solid shadow-md rounded-lg">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Comments</h2>
          <p className="text-muted-foreground">
            Share your thoughts on this gallery book.
          </p>
        </div>
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 border">
              <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5 flex flex-col">
              <div className="flex items-center gap-2">
                <div className="font-medium">John Doe</div>
                <div className="text-xs text-muted-foreground">2 days ago</div>
              </div>
              <div>
                This is a great article! I learned a lot about the history of
                joke taxation. Can't wait to read more.
              </div>
              {allowUpVote && !editing && (
                <div
                  className={
                    'flex flex-wrap items-center gap-2 md:gap-3 text-sm px-3 pb-2'
                  }
                >
                  <div
                    // onClick={() => {
                    //   onVoteChange(!upvoted);
                    //   const currentAmount = (comment.actions || {})[
                    //     ACTIONS_TYPE.UPVOTE
                    //   ];
                    //   if (upvoted) {
                    //     if (currentAmount)
                    //       onChange({
                    //         selectedActions: comment.selectedActions?.filter(
                    //           (e) => e !== ACTIONS_TYPE.UPVOTE
                    //         ),
                    //         actions: {
                    //           ...(comment.actions || {}),
                    //           [ACTIONS_TYPE.UPVOTE]: currentAmount - 1,
                    //         },
                    //       });
                    //   } else {
                    //     onChange({
                    //       selectedActions: [
                    //         ...(comment.selectedActions ?? []),
                    //         ACTIONS_TYPE.UPVOTE,
                    //       ],
                    //       actions: {
                    //         ...(comment.actions || {}),
                    //         [ACTIONS_TYPE.UPVOTE]: currentAmount
                    //           ? currentAmount + 1
                    //           : 1,
                    //       },
                    //     });
                    //   }
                    // }}
                    className={`border ${upvoted ? `border-[#4493f8] text-[#4493f8]` : ''} rounded-xl px-2 py-0.5 inline-flex gap-1 items-center cursor-pointer`}
                  >
                    <ArrowUpIcon size={16} />
                    <span>{upvote ?? 0}</span>
                  </div>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className={'p-0.5 rounded-full border cursor-pointer'}
                        >
                          <SmileIcon size={16} />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className={'p-0.5'} align={'start'}>
                        <EmojiSelect
                          value={comment.selectedActions}
                          onSelect={(v, changeValue: ACTIONS_TYPE) => {
                            const currentAmount = (comment.actions || {})[
                              changeValue
                            ];
                            // onChange({
                            //   selectedActions: v,
                            //   actions: {
                            //     ...(comment.actions || {}),
                            //     [changeValue]: currentAmount
                            //       ? currentAmount + 1
                            //       : 1,
                            //   },
                            // });
                          }}
                          onUnSelect={(v, changeValue: ACTIONS_TYPE) => {
                            const currentAmount = (comment.actions || {})[
                              changeValue
                            ];
                            // if (currentAmount && currentAmount > 0)
                            //   onChange({
                            //     selectedActions: v.filter(
                            //       (f) => f !== changeValue
                            //     ),
                            //     actions: {
                            //       ...(comment.actions || {}),
                            //       [changeValue]: currentAmount - 1,
                            //     },
                            //   });
                          }}
                          className={''}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {actions?.map((e) => (
                    <div
                      key={e.id}
                      className={`border ${upvoted ? `border-[#4493f8] text-[#4493f8]` : ''} rounded-xl px-2 py-0.5 inline-flex gap-1 items-center cursor-pointer`}
                    >
                      <span>{e.emoji}</span>
                      <span>{(comment.actions ?? {})[e.id]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Avatar className="w-10 h-10 border">
              <AvatarImage src="/placeholder-user.jpg" alt="@shadcn" />
              <AvatarFallback>JA</AvatarFallback>
            </Avatar>
            <div className="grid gap-1.5">
              <div className="flex items-center gap-2">
                <div className="font-medium">Jane Appleseed</div>
                <div className="text-xs text-muted-foreground">1 week ago</div>
              </div>
              <div>
                Fascinating read! I had no idea about the Joke Tax Chronicles.
                Looking forward to more content like this.
              </div>
            </div>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Add a Comment</CardTitle>
            <CardDescription>
              Share your thoughts and feedback on this article.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="comment">Comment</Label>
                <Textarea
                  id="comment"
                  placeholder="Write your comment"
                  className="min-h-[100px]"
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit">Submit</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
);

export default CommentPanel;
