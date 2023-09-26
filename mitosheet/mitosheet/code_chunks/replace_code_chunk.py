
#!/usr/bin/env python
# coding: utf-8

# Copyright (c) Saga Inc.
# Distributed under the terms of the GPL License.
from typing import List, Tuple
from mitosheet.code_chunks.code_chunk import CodeChunk
from mitosheet.types import ColumnID
from mitosheet.state import State
import pandas as pd

from mitosheet.errors import MitoError

class ReplaceCodeChunk(CodeChunk):

    def __init__(self, prev_state: State, post_state: State, sheet_index: int, column_ids: List[ColumnID], search_value: str, replace_value: str):
        super().__init__(prev_state, post_state)
        self.sheet_index = sheet_index
        self.column_ids = column_ids
        self.search_value = search_value
        self.replace_value = replace_value
        self.df = self.prev_state.dfs[self.sheet_index]
        self.df_name = self.prev_state.df_names[self.sheet_index]

    def get_display_name(self) -> str:
        return 'Replace'
    
    def get_description_comment(self) -> str:
        return f"Replace {self.search_value} with {self.replace_value} in {self.prev_state.df_names[self.sheet_index]}"

    def get_code(self) -> Tuple[List[str], List[str]]:
        search_value = self.search_value
        replace_value = self.replace_value
        column_ids = self.column_ids
        df_name = self.df_name
        selected_columns = self.df_name
        df = self.df

        if (column_ids is not None and len(column_ids) > 0):
            selected_columns = f'{self.df_name}[{column_ids}]'
            df = self.df[column_ids]
        
        # The shorter code chunk is for dataframes that *don't* have any boolean columns
        # Boolean columns are a special case, because when we convert them to str then back
        # to bool, they all become True. So we have to convert them back to bool with a custom
        # function.
        code_chunk = [
            f'{selected_columns} = {selected_columns}.astype(str).replace("(?i){search_value}", "{replace_value}", regex=True).astype({selected_columns}.dtypes.to_dict())',
        ]

        if (any(df.dtypes == 'timedelta') and pd.__version__ < 1.4):
            raise MitoError(
                'version_error',
                'Pandas version error',
                'This version of pandas doesn\'t support replacing values in timedelta columns. Please upgrade to pandas 1.2 or later.',
            )
        if any(df.dtypes == bool):
            code_chunk = [
                f"non_bool_cols, bool_cols = {selected_columns}.select_dtypes(exclude='bool'), {selected_columns}.select_dtypes(include='bool')",
                f"{df_name}[non_bool_cols.columns] = non_bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}', regex=True).astype(non_bool_cols.dtypes.to_dict())",
                f"{df_name}[bool_cols.columns] = bool_cols.astype(str).replace('(?i){search_value}', '{replace_value}', regex=True).applymap(cast_string_to_bool).astype(bool)",
            ]

        # Then, we always replace the search_value inside the column headers
        if any(df.columns.str.contains(search_value, case=False)):
            code_chunk.append(f"{selected_columns}.columns = {selected_columns}.columns.str.replace('(?i){search_value}', '{replace_value}', regex=True)")
        return code_chunk, []

    def get_edited_sheet_indexes(self) -> List[int]:
        return [self.sheet_index]
    