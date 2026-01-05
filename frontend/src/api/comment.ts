import { apiRequest } from '@/lib/apiClient';
import { User } from './user';
import { Gallery } from './gallery';
import qs from 'qs';

// import { TipTapNode } from '@troop.com/tiptap-react-render';
// import { Content } from '@tiptap/react';
export const LIST_EMOJI = ['👍', '👎', '😄', '🎉', '😕', '❤️', '🚀', '👀'];
export enum ACTIONS_TYPE {
  THUMB_UP = 'THUMB_UP',
  THUMB_DOWN = 'THUMB_DOWN',
  LAUGH = 'LAUGH',
  HOORAY = 'HOORAY',
  CONFUSED = 'CONFUSED',
  HEART = 'HEART',
  ROCKET = 'ROCKET',
  EYE = 'EYE',
  UPVOTE = 'UPVOTE',
}

export const ACTIONS = [
  {
    id: ACTIONS_TYPE.THUMB_UP,
    emoji: LIST_EMOJI[0],
  },
  {
    id: ACTIONS_TYPE.THUMB_DOWN,
    emoji: LIST_EMOJI[1],
  },
  {
    id: ACTIONS_TYPE.LAUGH,
    emoji: LIST_EMOJI[2],
  },
  {
    id: ACTIONS_TYPE.HOORAY,
    emoji: LIST_EMOJI[3],
  },
  {
    id: ACTIONS_TYPE.CONFUSED,
    emoji: LIST_EMOJI[4],
  },
  {
    id: ACTIONS_TYPE.HEART,
    emoji: LIST_EMOJI[5],
  },
  {
    id: ACTIONS_TYPE.ROCKET,
    emoji: LIST_EMOJI[6],
  },
  {
    id: ACTIONS_TYPE.EYE,
    emoji: LIST_EMOJI[7],
  },
];

export interface Reaction {
  id: number;
  createdAt?: Date;
  updatedAt?: Date;
  commentId?: number;
  comment: Comment;
  type: ACTIONS_TYPE;
}
export interface ActionCount {
  commentId: number;
  comment: Comment;
  upvote: number;
  rocket: number;
  heart: number;
  thumbUp: number;
  thumbDown: number;
  laugh: number;
  hooray: number;
  confused: number;
  eye: number;
}
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
  gallery?: Gallery;
  selectedActions?: ACTIONS_TYPE[];
  actions: { [key in ACTIONS_TYPE]: number };
}

export interface CreateCommentRequest {
  text: string;
  userId?: number;
  galleryId: number;
  parentId?: number;
}
// Function to create new comment
export const createComment = async (
  commentData: CreateCommentRequest
): Promise<Comment> => {
  return await apiRequest<Comment>(
    '/comments',
    'POST',
    qs.stringify(commentData)
  );
};

export type ToggleReactionResponse = {
  active: boolean;
  actions: { [key in ACTIONS_TYPE]: number };
  selectedActions: ACTIONS_TYPE[];
};

export const toggleCommentReaction = async (
  commentId: number,
  type: ACTIONS_TYPE
): Promise<ToggleReactionResponse> => {
  return await apiRequest<ToggleReactionResponse>(
    `/comments/${commentId}/reactions/toggle`,
    'POST',
    { type }
  );
};

// Function to edit new comment
export const editComment = async (commentData: Comment): Promise<Comment> => {
  return await apiRequest<Comment>(
    `/comments/${commentData.id}`,
    'PATCH',
    qs.stringify(commentData)
  );
};

// Fetching comments
export const getComments = async (galleryId: number): Promise<Comment[]> => {
  return await apiRequest<Comment[]>('/comments', 'GET', undefined, {
    galleryId: galleryId,
  });
};

// Fetch single comment
export const getComment = async (
  commentId: string | undefined
): Promise<Comment> => {
  return await apiRequest<Comment>(`/comments/${commentId}`, 'GET');
};

export type CommentScope = 'onMyGalleries' | 'authored' | 'mentions';

export type CommentAuthor = {
  id: number;
  name: string;
  avatar?: string | null;
  avatarUrl?: string | null;
  profile?: { avatarUrl?: string | null } | null;
};

export type CommentGallery = {
  id: number;
  title: string | null;
  thumbnail?: string | null;
};

export type CommentItem = {
  id: number;
  body: string;
  createdAt: string; // ISO
  author: CommentAuthor;
  gallery: CommentGallery;
};

export type CommentsListResponse = {
  items: CommentItem[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getCommentsList(params: {
  scope: CommentScope;
  page: number;
  pageSize: number;
  search?: string;
}) {
  return apiRequest<CommentsListResponse>(
    '/me/comments',
    'GET',
    undefined,
    params
  );
}
