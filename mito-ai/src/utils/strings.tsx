import OpenAI from "openai";

export const PYTHON_CODE_BLOCK_START_WITH_NEW_LINE = '```python\n'
export const PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE = '```python'
export const PYTHON_CODE_BLOCK_END_WITH_NEW_LINE = '\n```'
export const PYTHON_CODE_BLOCK_END_WITHOUT_NEW_LINE = '```'


/* 
    Given a message from the OpenAI API, returns the content as a string. 
    If the content is not a string, returns undefined.
*/
const getContentStringFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam): string | undefined => {
    
    // TODO: We can't assume this is a string. We need to handle the other
    // return options
    if (message.role === 'user' ||  message.role === 'assistant') {
        return message.content as string
    }

    return undefined
}


/* 
    Given a string like "Hello ```python print('Hello, world!')```",
    returns ["Hello", "```python print('Hello, world!')```"]

    This is useful for taking an AI generated message and displaying the code in 
    code blocks and the rest of the message in plain text.
*/
export const splitStringWithCodeBlocks = (message: OpenAI.Chat.ChatCompletionMessageParam) => {
    const messageContent = getContentStringFromMessage(message)

    if (!messageContent) {
        return []
    }

    const parts = messageContent.split(/(```[\s\S]*?```)/);
    
    // Remove empty strings caused by consecutive delimiters, if any
    return parts.filter(part => part.trim() !== "");
}

/* 
    Given a string like "Hello ```python print('Hello, world!')```",
    returns "```python print('Hello, world!')```"
*/
export const getCodeBlockFromMessage = (message: OpenAI.Chat.ChatCompletionMessageParam) => {
    const parts = splitStringWithCodeBlocks(message)
    return parts.find(part => part.startsWith('```'))
}


/* 
    To display code in markdown, we need to take input values like this:

    ```python x + 1```

    And turn them into this:

    ```python
    x + 1
    ```

    Sometimes, we also want to trim the code to remove any leading or trailing whitespace. For example, 
    when we're displaying the code in the chat history this is useful. Othertimes we don't want to trim.
    For example, when we're displaying the code in the active cell, we want to keep the users's whitespace.
    This is important for showing diffs. If the code cell contains no code, the first line will be marked as 
    removed in the code diff. To ensure the diff lines up with the code, we need to leave this whitespace line.
*/
export const addMarkdownCodeFormatting = (code: string, trim?: boolean) => {
    
    let codeWithoutBackticks = code
    
    // If the code already has the code formatting backticks, remove them 
    // so we can add them back in the correct format
    if (code.split(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE).length > 1) {
        codeWithoutBackticks = code.split(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE)[1].split(PYTHON_CODE_BLOCK_END_WITHOUT_NEW_LINE)[0]
    } else {
        codeWithoutBackticks = code
    }

    if (trim) {
        codeWithoutBackticks = codeWithoutBackticks.trim()
    }
  
    // Note: We add a space after the code because for some unknown reason, the markdown 
    // renderer is cutting off the last character in the code block.
    return `${PYTHON_CODE_BLOCK_START_WITH_NEW_LINE}${codeWithoutBackticks} ${PYTHON_CODE_BLOCK_END_WITH_NEW_LINE}`
}

/* 
    To write code in a Jupyter Code Cell, we need to take inputs like this: 

    ```python
    x + 1
    ```

    And turn them into this:

    x + 1

    Jupyter does not need the backticks. 
*/
export const removeMarkdownCodeFormatting = (code: string) => {

    if (code.split(PYTHON_CODE_BLOCK_START_WITHOUT_NEW_LINE).length > 1) {
        return code.split(PYTHON_CODE_BLOCK_START_WITH_NEW_LINE)[1].split(PYTHON_CODE_BLOCK_END_WITH_NEW_LINE)[0]
    }

    return code
}