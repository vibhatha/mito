import hashlib
import json
import os
import pickle
from typing import Any, Dict, List, Callable, Optional, Tuple, Union

import pandas as pd

from mitosheet.mito_backend import MitoBackend
from mitosheet.utils import get_new_id

def _get_dataframe_hash(df: pd.DataFrame) -> bytes:
    """
    Returns a hash for a pandas dataframe that is consistent across runs, notably including:
    1. The column names
    2. The values of the dataframe
    3. The index of the dataframe
    4. The order of all of these
    """
    try:
        return hashlib.md5(
            bytes(str(pd.util.hash_pandas_object(df.columns)), 'utf-8') +
            bytes(str(pd.util.hash_pandas_object(df)), 'utf-8')
        ).digest()
    except TypeError as e:        
        # Use pickle if pandas cannot hash the object for example if
        # it contains unhashable objects.
        return b"%s" % pickle.dumps(df, pickle.HIGHEST_PROTOCOL)

def get_dataframe_hash(df: pd.DataFrame) -> bytes:
    _PANDAS_ROWS_LARGE = 100000
    _PANDAS_SAMPLE_SIZE = 10000
    
    if len(df) >= _PANDAS_ROWS_LARGE:
        df = df.sample(n=_PANDAS_SAMPLE_SIZE, random_state=0)
    
    return _get_dataframe_hash(df)

try:
    import streamlit.components.v1 as components
    import streamlit as st


    parent_dir = os.path.dirname(os.path.abspath(__file__))

    mito_build_dir = os.path.join(parent_dir, "mitoBuild")
    _mito_component_func = components.declare_component("my_component", path=mito_build_dir)

    message_passer_build_dr = os.path.join(parent_dir, "messagingBuild")
    _message_passer_component_func = components.declare_component("message-passer", path=message_passer_build_dr)

    @st.cache_resource(hash_funcs={pd.DataFrame: get_dataframe_hash})
    def _get_mito_backend(
            *args: Union[pd.DataFrame, str, None], 
            _importers: Optional[List[Callable]]=None, 
            _sheet_functions: Optional[List[Callable]]=None, 
            df_names: Optional[List[str]]=None,
            key: Optional[str]=None # So it caches on key
        ) -> Tuple[MitoBackend, List[Any]]: 

        mito_backend = MitoBackend(
            *args, 
            user_defined_importers=_importers, user_defined_functions=_sheet_functions
        )

        # Make a send function that stores the responses in a list
        responses = []
        def send(response):
            responses.append(response)
        
        mito_backend.mito_send = send

        if df_names is not None and len(df_names) > 0:
            mito_backend.receive_message(
                {
                    'event': 'update_event',
                    'id': get_new_id(),
                    'type': 'args_update',
                    'params': {
                        'args': df_names
                    },
                }
            )

        return mito_backend, responses

    def message_passer_component(key: Optional[str]=None) -> Any:
        """
        This component simply passes messages from the frontend to the backend,
        so that the backend can process them before it is rendered.
        """
        component_value = _message_passer_component_func(key=key)
        return component_value


    def spreadsheet( # type: ignore
            *args: Union[pd.DataFrame, str, None], 
            sheet_functions: Optional[List[Callable]]=None, 
            importers: Optional[List[Callable]]=None, 
            df_names: Optional[List[str]]=None,
            key=None
        ) -> Tuple[Dict[str, pd.DataFrame], str]:
        """
        Create a new instance of the Mito spreadsheet in a streamlit app.

        Parameters
        ----------
        args: pd.Dataframe or str or None
            The arguments to pass to the Mito spreadsheet. If a dataframe is
            passed, it will be displayed as a sheet tab. If a string is passed,
            it will be read in with a pd.read_csv call. If None is passed, it 
            will be skipped.
        sheet_functions: List[Callable]
            A list of functions that can be used in the spreadsheet. Functions
            should be capitalized.
        importers: List[Callable]
            A list of functions that can be used to import dataframes. Each
            function should return a dataframe. 
        df_names: List[str]
            A list of names for the dataframes passed in. If None, the dataframes
            will be named df0, df1, etc.
        key: str or None
            An key that uniquely identifies this component. This must be passed
            for now, or the component will not work. Not sure why.

        Returns
        -------
        Tuple[Dict[str, pd.DataFrame], List[str]]
            A tuple. The first element is a mapping from dataframe names to the
            final dataframes. The second element is a list of lines of code
            that were executed in the Mito spreadsheet.
        """
        mito_backend, responses = _get_mito_backend(
            *args, 
            _sheet_functions=sheet_functions,
            _importers=importers, 
            df_names=df_names, 
            key=key
        )

        # Mito widgets need new ids every time a new one is displayed. As such, if
        # the key is None, we generate a new one. Notably, we do this after getting the
        # mito_backend, so that we can cache the mito_backend on the user provided key.
        if key is None:
            key = mito_backend.analysis_name

        sheet_data_json = mito_backend.steps_manager.sheet_data_json,
        analysis_data_json = mito_backend.steps_manager.analysis_data_json,
        user_profile_json = mito_backend.get_user_profile_json()

        msg = message_passer_component(key=str(key) + 'message_passer')
        # Check if the message has already been received. We'll know if the ID of the message
        # is in the responses list
        if msg is not None and msg['id'] not in [response['id'] for response in responses]:
            print("got message", msg['type'], mito_backend.analysis_name)
            print(msg['id'], [response['id'] for response in responses])
            mito_backend.receive_message(msg)

        print("mito_backend", type(args[0]), mito_backend.analysis_name, len(mito_backend.steps_manager.steps_including_skipped))
            
        responses_json = json.dumps(responses)

        _mito_component_func(
            key=key, 
            sheet_data_json=sheet_data_json, analysis_data_json=analysis_data_json, user_profile_json=user_profile_json, 
            responses_json=responses_json, id=id(mito_backend)
        )

        # We return a mapping from dataframe names to dataframes
        final_state = mito_backend.steps_manager.curr_step.final_defined_state
        code = mito_backend.steps_manager.code()
        return {
            df_name: df for df_name, df in 
            zip(final_state.df_names, final_state.dfs)
        }, "\n".join(code)
    
except ImportError:
    def spreadsheet(*args, key=None): # type: ignore
        raise RuntimeError("Couldn't import streamlit. Install streamlit with `pip install streamlit` to use the mitosheet component.")