import { User } from '../types/user';
interface EditorCommentProps {
    value?: string;
    onChange?: (val: string) => void;
    placeholder?: string;
    onUpload?: (image: File) => Promise<string>;
    theme: 'light' | 'dark' | 'system';
    currentUser?: User;
}
export declare const EditingEditorComment: ({ value, onChange, placeholder, onUpload, theme, currentUser, }: EditorCommentProps) => import("react/jsx-dev-runtime").JSX.Element;
export {};
//# sourceMappingURL=EditingEditorComment.d.ts.map