import { User } from './user';
export declare const LIST_EMOJI: string[];
export declare enum ACTIONS_TYPE {
    THUMB_UP = "THUMB_UP",
    THUMB_DOWN = "THUMB_DOWN",
    LAUGH = "LAUGH",
    HOORAY = "HOORAY",
    CONFUSED = "CONFUSED",
    HEART = "HEART",
    ROCKET = "ROCKET",
    EYE = "EYE",
    UPVOTE = "UPVOTE"
}
export declare const ACTIONS: {
    id: ACTIONS_TYPE;
    emoji: string;
}[];
export interface Comment {
    id: number;
    createdAt?: Date;
    updatedAt?: Date;
    userId: number;
    user?: User;
    parentId?: number;
    parent: Comment;
    replies?: Comment[];
    text: string;
    galleryId: number;
    selectedActions?: ACTIONS_TYPE[];
    actions?: {
        [key in ACTIONS_TYPE]: number;
    };
}
export interface CreateCommentRequest {
    text: string;
    userId?: number;
    galleryId: number;
    parentId?: number;
}
//# sourceMappingURL=comment.d.ts.map