import React from 'react';
import PythonCode from './PythonCode';
import { INotebookTracker } from '@jupyterlab/notebook';
import { getNotebookName } from '../../../utils/notebook';
import { IRenderMimeRegistry } from '@jupyterlab/rendermime';
import { removeMarkdownCodeFormatting } from '../../../utils/strings';
import { JupyterFrontEnd } from '@jupyterlab/application';
import { OperatingSystem } from '../../../utils/user';
import '../../../../style/CodeMessagePart.css'
import { UnifiedDiffLine } from '../../../utils/codeDiff';


interface ICodeBlockProps {
    code: string,
    codeCellID: string | undefined,
    role: 'user' | 'assistant'
    rendermime: IRenderMimeRegistry
    notebookTracker: INotebookTracker,
    app: JupyterFrontEnd,
    isLastAiMessage: boolean,
    operatingSystem: OperatingSystem,
    setDisplayCodeDiff: React.Dispatch<React.SetStateAction<UnifiedDiffLine[] | undefined>>;
    acceptAICode: (codeCellID: string) => void,
    rejectAICode: (codeCellID: string) => void
}

const CodeBlock: React.FC<ICodeBlockProps> = ({
    code,
    codeCellID,
    role,
    rendermime,
    notebookTracker,
    app,
    isLastAiMessage,
    operatingSystem,
    setDisplayCodeDiff,
    acceptAICode,
    rejectAICode
}): JSX.Element => {

    const notebookName = getNotebookName(notebookTracker)

    const copyCodeToClipboard = () => {
        const codeWithoutMarkdown = removeMarkdownCodeFormatting(code)
        navigator.clipboard.writeText(codeWithoutMarkdown)
    }

    if (role === 'user') {
        return (
            <div className='code-message-part-container'>
                <PythonCode
                    code={code}
                    rendermime={rendermime}
                />
            </div>
        )
    }

    if (role === 'assistant') {
        return (
            <div className='code-message-part-container'>
                <div className='code-message-part-toolbar'>
                    <div className='code-location'>
                        {notebookName}
                    </div>
                    {isLastAiMessage && codeCellID !== undefined && (
                        <>
                            <button onClick={() => { acceptAICode(codeCellID) }}>
                                Apply {operatingSystem === 'mac' ? 'CMD+Y' : 'CTRL+Y'}
                            </button>
                            <button onClick={() => { rejectAICode(codeCellID) }}>
                                Deny {operatingSystem === 'mac' ? 'CMD+D' : 'CTRL+D'}
                            </button>
                        </>
                    )}
                    <button onClick={copyCodeToClipboard}>Copy</button>
                </div>
                <PythonCode
                    code={code}
                    rendermime={rendermime}
                />
            </div>
        )
    }

    return <></>
}

export default CodeBlock