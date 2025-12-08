declare module 'reactjs-tiptap-editor' {
  import type { Editor } from '@tiptap/react';
  import type React from 'react';

  /**
   * Hook returned by older versions of reactjs-tiptap-editor.
   * Type is kept loose since the package ships mismatched typings.
   */
  export function useEditorState(): {
    editor: Editor | null;
    editorRef: React.MutableRefObject<any>;
    isReady: boolean;
  };

  const RichTextEditor: any;
  export default RichTextEditor;
}
