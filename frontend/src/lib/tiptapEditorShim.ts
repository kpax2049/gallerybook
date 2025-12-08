import { useRef } from 'react';
import RichTextEditor from 'reactjs-tiptap-editor';

/**
 * Minimal shim to replace the missing named export in reactjs-tiptap-editor@0.4.x.
 * We only need a ref and a truthy ready flag for the current UI.
 */
export function useEditorState() {
  const editorRef = useRef(null);
  return {
    editor: null as any,
    editorRef,
    isReady: true,
  };
}

export default RichTextEditor;
