// Copyright (c) Mito

import React, { useEffect, useState } from 'react';
import MitoAPI from '../../api';
import { classNames } from '../../utils/classNames';
import Input from '../elements/Input';
import { GraphDataJSON, GraphID, UIState } from '../../types';
import { focusGrid } from '../endo/focusUtils';

// import icons
import SelectedSheetTabDropdownIcon from '../icons/SelectedSheetTabDropdownIcon';
import UnselectedSheetTabDropdownIcon from '../icons/UnselectedSheetTabDropdownIcon';
import { TaskpaneInfo, TaskpaneType } from '../taskpanes/taskpanes';
import { ModalEnum } from '../modals/modals';
import GraphIcon from '../icons/GraphIcon';
import DataSheetTabActions from './DataSheetTabActions';
import GraphSheetTabActions from './GraphSheetTabActions';

export const selectPreviousGraphSheetTab = (graphDataJSON: GraphDataJSON, setUIState: React.Dispatch<React.SetStateAction<UIState>>): void => {
    const graphIDs = Object.keys(graphDataJSON)
    const newGraphID: GraphID | undefined = graphIDs.length > 0 ? graphIDs[graphIDs.length - 1] : undefined

    if (newGraphID) {
        // If there is a graph, then keep dispalying graphs, otherwise display a data tab
        setUIState((prevUIState) => {
            return {
                ...prevUIState,
                selectedGraphID: newGraphID,
                selectedTabType: 'graph',
                currOpenTaskpane: {type: TaskpaneType.GRAPH, graphID: newGraphID}
            }
        })
    } else {
        // If there are no more graphs, close the graph taskpane and display a data sheet instead
        setUIState((prevUIState) => {
            return {
                ...prevUIState,
                selectedGraphID: undefined,
                selectedTabType: 'data',
                currOpenTaskpane: {type: TaskpaneType.NONE}
            }
        })
    }
}

type SheetTabProps = {
    tabName: string;
    tabIDObj: {tabType: 'data', sheetIndex: number} | {tabType: 'graph', graphID: GraphID};
    isSelectedTab: boolean;
    setUIState: React.Dispatch<React.SetStateAction<UIState>>;
    closeOpenEditingPopups: () => void;
    mitoAPI: MitoAPI;
    mitoContainerRef: React.RefObject<HTMLDivElement>;
    graphDataJSON: GraphDataJSON;
};

/*
    Component that displays a dataframe name at the bottom of the sheet, and
    furthermore renders the sheet actions if the sheet action dropdown is 
    clicked.
*/
export default function SheetTab(props: SheetTabProps): JSX.Element {

    
    // We only set this as open if it the currOpenSheetTabActions
    const [displayActions, setDisplayActions] = useState(false);
    const [isRename, setIsRename] = useState<boolean>(false);
    const [newTabName, setNewTabName] = useState<string>(props.tabName);

    // Make sure that if we change the sheet tab name that is displayed, we default to 
    // the correct new name as well
    useEffect(() => {
        setNewTabName(props.tabName);
    }, [props.tabName])
    
    const onRename = async (): Promise<void> => {
        if (props.tabIDObj.tabType === 'data') {
            await props.mitoAPI.editDataframeRename(
                props.tabIDObj.sheetIndex,
                newTabName
            );
        } else {
            await props.mitoAPI.editGraphRename(
                props.tabIDObj.graphID,
                newTabName
            )
        }
        
        setDisplayActions(false);
        setIsRename(false);

        // Focus back on the grid
        const endoGridContainer = props.mitoContainerRef.current?.querySelector('.endo-grid-container') as HTMLDivElement | null | undefined;
        focusGrid(endoGridContainer)
    }

    return (
        <div 
            className={classNames('tab', {'tab-graph': props.tabIDObj.tabType === 'graph'}, {'tab-selected': props.isSelectedTab})} 
            onClick={() => {
                props.setUIState(prevUIState => {
                    if (props.tabIDObj.tabType === 'data') {
                        // If the user clicks on a data sheet tab, switch to it and make sure the graph taskpane is not open
                        const taskpaneInfo: TaskpaneInfo = prevUIState.currOpenTaskpane.type === TaskpaneType.GRAPH ? 
                            {type: TaskpaneType.NONE} : prevUIState.currOpenTaskpane

                        return {
                            ...prevUIState,
                            selectedTabType: 'data',
                            selectedSheetIndex: props.tabIDObj.sheetIndex,
                            currOpenTaskpane: taskpaneInfo
                        }
                    } else {
                        return {
                            ...prevUIState,
                            selectedTabType: 'graph',
                            selectedGraphID: props.tabIDObj.graphID,
                            currOpenModal: {type: ModalEnum.None},
                            currOpenTaskpane: {
                                type: TaskpaneType.GRAPH,
                                graphID: props.tabIDObj.graphID
                            } 
                        }
                    }
                })
            }} 
            onDoubleClick={() => {setIsRename(true)}} >
            <div className='tab-content'>
                {props.tabIDObj.tabType === 'graph' &&
                    /* Put it inside a div so everything is spaced correctly */
                    <div>
                        <GraphIcon variant={props.isSelectedTab ? 'light' : 'dark'}/>
                    </div>
                }
                {isRename && 
                    <form 
                        onSubmit={async (e) => {e.preventDefault(); await onRename()}}
                        onBlur={onRename}
                    >
                        <Input 
                            value={newTabName} 
                            onChange={(e) => {setNewTabName(e.target.value)}}
                            autoFocus
                        />
                    </form>
                }
                {!isRename &&
                    <p>
                        {props.tabName} 
                    </p>
                }
                {/* Display the dropdown that allows a user to perform some action */}
                <div className='sheet-tab-dropdown-button-div' onClick={() => {setDisplayActions(true)}}>
                    {props.isSelectedTab ? <SelectedSheetTabDropdownIcon /> : <UnselectedSheetTabDropdownIcon />}
                </div>
            </div>
            {displayActions && props.tabIDObj.tabType === 'data' &&
                <DataSheetTabActions 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    sheetIndex={props.tabIDObj.sheetIndex}
                    mitoAPI={props.mitoAPI}
                    graphDataJSON={props.graphDataJSON}
                />
            }
            {displayActions && props.tabIDObj.tabType === 'graph' &&
                <GraphSheetTabActions 
                    setDisplayActions={setDisplayActions}
                    setUIState={props.setUIState}
                    closeOpenEditingPopups={props.closeOpenEditingPopups}
                    setIsRename={setIsRename}
                    graphID={props.tabIDObj.graphID}
                    mitoAPI={props.mitoAPI}
                    graphDataJSON={props.graphDataJSON}
                />
            }
        </div>
    );
}
