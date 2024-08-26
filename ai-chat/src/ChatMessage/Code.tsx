import React, { useEffect, useRef } from 'react';
import { CodeMirrorEditor, IEditorLanguageRegistry } from '@jupyterlab/codemirror';
import { CodeEditor } from '@jupyterlab/codeeditor';

// TODO: We want to display the code using the CodeMirrorEditor 
// so that it is identical to the code in the Jupyter Notebook cells. 
// However, I am unable to get the syntax highliting to work. So for now, 
// we are just using an unstyled codemirror editor.

interface ICodeProps {
  code: string;
  languageRegistry: IEditorLanguageRegistry;
}

const Code: React.FC<ICodeProps> = ({ code, languageRegistry }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editorInstanceRef = useRef<CodeMirrorEditor | null>(null);

  code = code.trim();



  useEffect(() => {
    if (editorRef.current) {
        if (!editorInstanceRef.current) {
            const model = new CodeEditor.Model({
                mimeType: 'text/x-python'
            })

            console.log("model", model)

            editorInstanceRef.current = new CodeMirrorEditor({
                host: editorRef.current,
                model: model,
                config: {
                    readOnly: true,
                    lineNumbers: false,
                    mode: 'python',
                },  
                languages: languageRegistry
            });
        }
    }

    return () => {
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, [code]);

  return (
    <div ref={editorRef} style={{ height: 'auto' }} />
  );
};

export default Code;