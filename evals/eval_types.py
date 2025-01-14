from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional

@dataclass(frozen=True)
class NotebookState:
    """Represents the state of variables in a notebook at test time"""
    global_vars: Dict[str, Any]
    cell_contents: List[str]
    
    
@dataclass(frozen=True)
class TestCase:
    """A single test case with input state and expected output"""
    name: str
    notebook_state: NotebookState
    user_input: str
    expected_code: str
    tags: List[Literal[
        'variable_declaration', 
        'function_declaration',
        'df_transformation',
        'df_creation',
        'pandas',
        'misc',
        'multistep'
    ]]
    variables_to_compare: Optional[List[str]] = None

@dataclass(frozen=True)
class TestCaseResult:
    test: TestCase
    passed: bool


class PromptGenerator():

    prompt_name: str

    def get_prompt(self, user_input: str, notebook_state: NotebookState) -> str:
        raise NotImplementedError("Subclasses must implement this method")

