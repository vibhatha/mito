import React from 'react';
import { createRoot } from 'react-dom/client';
import { JupyterFrontEnd, JupyterFrontEndPlugin } from '@jupyterlab/application';
import { IRenderMimeRegistry} from '@jupyterlab/rendermime';
import { IRenderMime } from '@jupyterlab/rendermime-interfaces';
import { Widget } from '@lumino/widgets';
import { COMMAND_MITO_AI_OPEN_CHAT, COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE } from '../../commands';
import MagicWandIcon from '../../icons/MagicWand';
import '../../../style/ErrorMimeRendererPlugin.css'

interface ErrorMessageProps {
    onDebugClick: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ onDebugClick }) => {
    return (
        <div className="error-mime-renderer-container">
            <button onClick={onDebugClick} className='error-mime-renderer-button'>
                <MagicWandIcon />
                <p>Fix Error in AI Chat</p>
            </button>
        </div>
    )
};
  
/**
 * A mime renderer plugin for the mimetype application/vnd.jupyter.stderr
 * 
 * This plugin augments the standard error output with a prompt to debug the error in the chat interface.
*/
const ErrorMimeRendererPlugin: JupyterFrontEndPlugin<void> = {
    id: 'mito-ai:debug-error-with-ai',
    autoStart: true,
    requires: [IRenderMimeRegistry],
    activate: (app: JupyterFrontEnd, rendermime: IRenderMimeRegistry) => {
        const factory = rendermime.getFactory('application/vnd.jupyter.stderr');
        
        if (factory) {
            rendermime.addFactory({
                safe: true,
                mimeTypes: ['application/vnd.jupyter.stderr'],
                createRenderer: (options: IRenderMime.IRendererOptions) => {
                    const originalRenderer = factory.createRenderer(options);
                    return new AugmentedStderrRenderer(app, originalRenderer);
                }
            }, -1);  // Giving this renderer a lower rank than the default renderer gives this default priority
        }
    }
};
  
/**
 * A widget that extends the default StderrRenderer.
*/
class AugmentedStderrRenderer extends Widget implements IRenderMime.IRenderer {
    private originalRenderer: IRenderMime.IRenderer;
    private app: JupyterFrontEnd;
  
    constructor(app: JupyterFrontEnd, originalRenderer: IRenderMime.IRenderer) {
        super();
        this.app = app;
        this.originalRenderer = originalRenderer;
    }
  
    /**
     * Render the original error message and append the custom prompt.
     */
    async renderModel(model: IRenderMime.IMimeModel): Promise<void> {
        // Determine if it's an error or a warning
        const isErrorMessage = 'application/vnd.jupyter.error' in model.data;

        // Create the container for the custom UI elements
        const resolveInChatDiv = document.createElement('div');

        // Only show the Fix Error in AI Chat button if it is an error, not a warning
        if (isErrorMessage) {
            createRoot(resolveInChatDiv).render(
                <ErrorMessage onDebugClick={() => this.openChatInterfaceWithError(model)} />
            );
        }

        // Append the chat container before rendering the original output
        this.node.appendChild(resolveInChatDiv);
        
        // Render the original content
        await this.originalRenderer.renderModel(model);
        const originalNode = this.originalRenderer.node;

        // Apply styling for warnings
        if (!isErrorMessage) {
            // Find the pre element inside originalNode and apply styles to it as well
            const preElement = originalNode.querySelector('pre');
            if (preElement) {
                preElement.style.background = 'var(--jp-warn-color3)';
                preElement.style.color = 'var(--md-grey-900)';
            }
        }



        // Append the original error/warning rendered node
        this.node.appendChild(originalNode);
    }

    /* 
        Open the chat interface and preload the error message into 
        the user input.
    */
    openChatInterfaceWithError(model: IRenderMime.IMimeModel): void {
        const conciseErrorMessage = this.getErrorString(model);
        this.app.commands.execute(COMMAND_MITO_AI_OPEN_CHAT)
        this.app.commands.execute(COMMAND_MITO_AI_SEND_DEBUG_ERROR_MESSAGE, { input: conciseErrorMessage });
    }

    /* 
        Get the error string from the model.
    */
    getErrorString(model: IRenderMime.IMimeModel): string {
        const error = model.data['application/vnd.jupyter.error']
        if (error && typeof error === 'object' && 'ename' in error && 'evalue' in error) {
            return `${error.ename}: ${error.evalue}`
        }
        return ''
    }
}
  
export default ErrorMimeRendererPlugin;