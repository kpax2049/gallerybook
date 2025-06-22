/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from 'zustand';
import { type Editor } from '@tiptap/react';

interface EditorState {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

export const useEditorStore = create<EditorState>((set: any) => ({
  editor: null,
  setEditor: (editor: any) => set({ editor }),
}));
