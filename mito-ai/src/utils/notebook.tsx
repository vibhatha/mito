import { INotebookTracker, NotebookPanel, Notebook, NotebookActions } from '@jupyterlab/notebook';
import { Cell, ICellModel } from '@jupyterlab/cells';
import { removeMarkdownCodeFormatting } from './strings';

export const getActiveCell = (notebookTracker: INotebookTracker): Cell | undefined => {
    const notebook = notebookTracker.currentWidget?.content;
    const activeCell = notebook?.activeCell;
    return activeCell || undefined
}

export const getActiveCellID = (notebookTracker: INotebookTracker): string | undefined => {
    return getActiveCell(notebookTracker)?.model.id
}

export const getActiveCellCode = (notebookTracker: INotebookTracker): string | undefined => {
    const activeCell = getActiveCell(notebookTracker)
    return activeCell?.model.sharedModel.source
}

export const getCellCodeByID = (notebookTracker: INotebookTracker, codeCellID: string | undefined): string | undefined => {
    if (codeCellID === undefined) {
        return undefined
    }

    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    return cell?.model.sharedModel.source
}

export const writeCodeToCellByID = (
    notebookTracker: INotebookTracker, 
    code: string | undefined, 
    codeCellID: string,
): void => {
    if (code === undefined) {
        return;
    }

    const codeMirrorValidCode = removeMarkdownCodeFormatting(code);
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    
    if (cell) {
        cell.model.sharedModel.source = codeMirrorValidCode;
    }
}

export const getNotebookName = (notebookTracker: INotebookTracker): string => {
    const notebook = notebookTracker.currentWidget?.content;
    return notebook?.title.label || 'Untitled'
}

export const highlightCodeCell = (notebookTracker: INotebookTracker, codeCellID: string) => {
    /*
        Briefly highlights a code cell, to draw the user's attention to it.
    */
    const notebook = notebookTracker.currentWidget?.content;
    const cell = notebook?.widgets.find(cell => cell.model.id === codeCellID);
    if (cell) {
        const cellElement = cell.node;
        const originalBackground = cellElement.style.background;
        
        // Add a yellow highlight
        cellElement.style.background = 'var(--purple-400)';
        
        // Remove highlight after 500ms
        cellElement.style.transition = 'background 0.5s ease';
        setTimeout(() => {
            cellElement.style.background = originalBackground;
        }, 500);
    }
}

/**
 * Get indices of all selected code cells in a Jupyter Notebook.
 * @param notebookModel - The notebook model containing the cells.
 * @returns An array of indices of selected code cells.
 */
/**
 * Get indices of all selected code cells in a Jupyter Notebook.
 * @param notebookTracker - The notebook tracker to find the current notebook.
 * @returns An array of indices of selected code cells.
 */
export const getSelectedCodeCellIds = (notebookTracker: INotebookTracker): string[] => {
    const selectedCodeCellIds: string[] = [];
    const notebook = notebookTracker.currentWidget?.content; // Get the current notebook widget's content

    if (notebook) {
        // Iterate over all cells in the notebook
        notebook.widgets.forEach((cell, index) => {
            // Check if the cell is selected and is a code cell
            if (notebook.isSelectedOrActive(cell) && cell.model.type === 'code') {
                selectedCodeCellIds.push(cell.model.id);
            }
        });
    }
    return selectedCodeCellIds;
};

/**
 * Find the index of a cell with a specific metadata ID.
 * @param {NotebookPanel} notebook - The active notebook panel.
 * @param {string} targetCellId - The target cell ID to search for.
 * @returns {number} The index of the target cell, or -1 if not found.
 */
export function findCellIndexById(notebook: Notebook, targetCellId: string): number {
    if (!notebook || !notebook.widgets || !targetCellId) {
      return -1;
    }
  
    return notebook.widgets.findIndex(cell => cell?.model?.id === targetCellId);
}

export function writeToCell(cell: ICellModel | undefined, code: string): void {
    if (cell == undefined) {
        return;
    }
    cell.sharedModel.source = code
}

/**
 * Insert a Markdown cell before a specific cell by ID.
 * @param {NotebookPanel} notebook - The active notebook panel.
 * @param {string} targetCellId - The ID of the target cell.
 */
export function insertMarkdownBeforeCell(notebook: NotebookPanel, targetCellId: string, aiMessage: string) {
  const targetIndex = findCellIndexById(notebook.content, targetCellId);
  if (targetIndex === -1) return;

  // Set the active cell index to the target index
  notebook.content.activeCellIndex = targetIndex;

  // Insert a new cell above the target index
  NotebookActions.insertAbove(notebook.content);
  NotebookActions.changeCellType(notebook.content, 'markdown');

  // Get the newly inserted cell
  const newCell = notebook.content.widgets[targetIndex];

  // Change the cell type to Markdown and write content
  if (newCell) {
    console.log("New cell ID >> ", newCell.model.id);
    writeToCell(newCell.model, aiMessage);
    NotebookActions.renderAllMarkdown(notebook.content);
  } else {
    console.error("New cell not found");
  }
}



