import { ACTIONS_TYPE, CreateCommentRequest, Comment } from '../types/comment';
import { User } from '../types/user';
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
    onReact?: (commentId: number, type: ACTIONS_TYPE, nextSelected: boolean) => void;
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
export declare const CommentCard: ({ comment, onReply, currentUser, allowUpVote, onChange, onReact, theme, onDelete, }: CommentCardProps) => import("react/jsx-dev-runtime").JSX.Element;
export declare const CommentSection: ({ className, formatDate, isMdxEditor, value, onChange, onReply, theme, currentUser, galleryId, allowUpVote, onReact, }: CommentProps) => import("react/jsx-dev-runtime").JSX.Element;
export {};
//# sourceMappingURL=CommentSection.d.ts.map