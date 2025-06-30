import { apiRequest } from '@/lib/apiClient';
import { User } from './user';
import { Gallery } from './gallery';
import qs from 'qs';

// import { TipTapNode } from '@troop.com/tiptap-react-render';
// import { Content } from '@tiptap/react';
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
  selectedActions: Reaction[];
  actions: ActionCount;
}

interface CreateCommentRequest {
  text: string;
  userId: number;
  galleryId?: string;
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

// Function to edit new comment
export const editComment = async (commentData: Comment): Promise<Comment> => {
  return await apiRequest<Comment>(
    `/comments/${commentData.id}`,
    'PATCH',
    qs.stringify(commentData)
  );
};

// Fetching comments
export const getComments = async (
  galleryId: string | undefined
): Promise<Comment[]> => {
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
