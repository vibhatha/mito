import copy
from typing import Dict, List, Optional
from evals.ai_api_calls.get_open_ai_completion import get_open_ai_completion
from evals.asserts.equal_globals import assert_equal_globals
from evals.asserts.equal_outputs import assert_equal_outputs
from evals.eval_types import ChatPromptGenerator, CodeGenTestCase, DebugPromptGenerator, SmartDebugTestCase, TestCaseResult
from evals.prompts.smart_debug_prompts import SMART_DEBUG_PROMPT_GENERATORS
from evals.test_cases.smart_debug_tests.smart_debug_tests import SMART_DEBUG_TESTS
from evals.test_runners.utils import exec_code_and_get_globals_and_output
from evals.utils import get_script_from_cells, print_test_case_result_tables


def run_smart_debug_tests(test_name: Optional[str], prompt_name: Optional[str], tags: Optional[List[str]]):

    tests_to_run = SMART_DEBUG_TESTS
    if test_name:
        tests_to_run = [test for test in SMART_DEBUG_TESTS if test.name == test_name]
        if not tests_to_run:
            print(f"No test found with name: {test_name}")
            exit(1)

    if tags:
        tests_to_run = [test for test in tests_to_run if any(tag in tags for tag in test.tags)]
        if not tests_to_run:
            print(f"No tests found with tags: {tags}")
            exit(1)

    print(f"Collected {len(tests_to_run)} tests")

    # Filter prompts if prompt name provided
    print("Collecting prompts...")
    prompt_generators_to_test = SMART_DEBUG_PROMPT_GENERATORS
    if prompt_name:
        prompt_generators_to_test = [prompt for prompt in SMART_DEBUG_PROMPT_GENERATORS if prompt.prompt_name == prompt_name]
        if not prompt_generators_to_test:
            print(f"No prompt found with name: {prompt_name}")
            exit(1)
    
    print(f"Collected {len(prompt_generators_to_test)} prompts")


    # Mapping from prompt name to test results for each prompt we test
    test_case_results: Dict[str, List[TestCaseResult]] = {}
    for prompt_generator in prompt_generators_to_test:
        test_case_results[prompt_generator.prompt_name] = []
        for test in tests_to_run:
            test_case_result = run_smart_debug_test(test, prompt_generator)
            test_case_results[prompt_generator.prompt_name].append(test_case_result)

    print_test_case_result_tables(test_case_results)


def run_smart_debug_test(test: SmartDebugTestCase, prompt_generator: DebugPromptGenerator) -> TestCaseResult:
    print(f"Running test: {test.name}")
                
    # Create a copy of the notebook state that includes the invalid code.
    script_without_invalid_code = get_script_from_cells(test.notebook_state.cell_contents)

    invalid_notebook_state = copy.deepcopy(test.notebook_state)
    
    # Add the invalid code to a new cell. This is fine because we're converting the whole thing
    # into a single script when we execute it anyways. 
    invalid_notebook_state.cell_contents.append(test.invalid_code)
    invalid_code_cells_script = get_script_from_cells(invalid_notebook_state.cell_contents, include_current_cell=True)

    # Exec the invalid code and get the error message
    error_message = None
    try:
        exec(invalid_code_cells_script, {})
    except Exception as e:
        error_message = str(e)

    print(f"Error message: {error_message}")
    if error_message is None:
        raise ValueError("Broken Test: Test did not produce an error.")
    
    # Ask the AI to correct the error
    # Make sure to use the invalid_notebook_state so that the prompt can include the 
    # invalid code in the prompt. 
    prompt = prompt_generator.get_prompt(error_message, invalid_notebook_state)
    ai_generated_code = get_open_ai_completion(prompt)
    actual_code = script_without_invalid_code + "\n" + ai_generated_code

    # Get the expected code script 
    expected_code = script_without_invalid_code + "\n" + test.correct_code

    # TODO: Turn this into a function and add it to utils.py
    # So that we can compare the results of the two scripts, create global context for 
    # each script. When calling exec, the globals are updated in place.

    expected_globals = {}
    actual_globals = {}

    try:
        expected_globals, expected_output = exec_code_and_get_globals_and_output(expected_code)
        actual_globals, actual_output = exec_code_and_get_globals_and_output(actual_code)
    except Exception as e:
        # Fail early if we can't execute the code
        print("Test Failed: ")
        print(f"Expected code:\n{expected_code}")
        print(f"\nActual code:\n{actual_code}")
        print(f"Error: {e}")
        return TestCaseResult(test=test, passed=False)

    equal_globals = assert_equal_globals(expected_globals, actual_globals, test.variables_to_compare)
    equal_outputs = assert_equal_outputs(expected_output, actual_output)
    passed = equal_globals and equal_outputs

    return TestCaseResult(test=test, passed=passed)
