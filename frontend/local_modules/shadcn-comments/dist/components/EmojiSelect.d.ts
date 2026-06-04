import { ACTIONS_TYPE } from "../types/comment";
interface EmojiSelectProps {
    className?: string;
    value?: string[];
    onSelect: (id: string[], changeValue: ACTIONS_TYPE) => void;
    onUnSelect: (id: string[], changeValue: ACTIONS_TYPE) => void;
}
export default function EmojiSelect({ className, value, onSelect, onUnSelect }: EmojiSelectProps): import("react/jsx-dev-runtime").JSX.Element;
export {};
//# sourceMappingURL=EmojiSelect.d.ts.map