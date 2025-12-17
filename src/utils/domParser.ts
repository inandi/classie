/**
 * DOM Parser Utilities
 * Functions for parsing HTML and extracting DOM information
 */

// Self-closing HTML tags
const SELF_CLOSING_TAGS = [
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
];

/**
 * Check if a tag is self-closing
 */
export function isSelfClosingTag(tagName: string): boolean {
    return SELF_CLOSING_TAGS.includes(tagName.toLowerCase());
}

/**
 * Get the ancestor chain as an array of tag names
 * @param documentText The full document text
 * @param elementOffset The offset position of the target element
 * @returns Array of ancestor tag names (from root to element)
 */
export function getDomAncestors(documentText: string, elementOffset: number): string[] {
    const tagStack: string[] = [];
    let i = 0;

    while (i < elementOffset) {
        // Skip comments
        if (documentText.substring(i, i + 4) === '<!--') {
            const commentEnd = documentText.indexOf('-->', i);
            if (commentEnd !== -1) {
                i = commentEnd + 3;
                continue;
            }
        }

        // Check for opening tag
        if (documentText[i] === '<' && documentText[i + 1] !== '/' && documentText[i + 1] !== '!') {
            const tagMatch = documentText.substring(i).match(/^<(\w+)([^>]*?)(\/?)>/);
            if (tagMatch) {
                const tagName = tagMatch[1].toLowerCase();
                const isSelfClose = tagMatch[3] === '/' || isSelfClosingTag(tagName);

                if (!isSelfClose) {
                    tagStack.push(tagName);
                }

                i += tagMatch[0].length;
                continue;
            }
        }

        // Check for closing tag
        if (documentText[i] === '<' && documentText[i + 1] === '/') {
            const closeMatch = documentText.substring(i).match(/^<\/(\w+)\s*>/);
            if (closeMatch) {
                const closingTagName = closeMatch[1].toLowerCase();

                // Pop matching opening tag from stack
                for (let j = tagStack.length - 1; j >= 0; j--) {
                    if (tagStack[j] === closingTagName) {
                        tagStack.splice(j, 1);
                        break;
                    }
                }

                i += closeMatch[0].length;
                continue;
            }
        }

        i++;
    }

    // Get the current element's tag name
    const currentTagMatch = documentText.substring(elementOffset).match(/^<(\w+)/);
    if (currentTagMatch) {
        tagStack.push(currentTagMatch[1].toLowerCase());
    }

    return tagStack;
}

/**
 * Get the ancestor chain as a string (for hashing)
 * @param documentText The full document text
 * @param elementOffset The offset position of the target element
 * @returns Ancestor chain string like "body>div>section>span"
 */
export function getDomAncestorChain(documentText: string, elementOffset: number): string {
    const ancestors = getDomAncestors(documentText, elementOffset);
    return ancestors.join('>');
}

/**
 * Find the HTML element at a given cursor position
 */
export interface ElementInfo {
    tagName: string;
    startOffset: number;
    endOffset: number;
    openingTagEnd: number;
    hasClass: boolean;
    classValue?: string;
    attributes: Map<string, string>;
}

/**
 * Find the element at the given cursor position
 * @param documentText The full document text
 * @param cursorOffset The cursor position offset
 * @returns ElementInfo or null if no element found
 */
export function findElementAtPosition(documentText: string, cursorOffset: number): ElementInfo | null {
    // Search backwards for '<'
    let tagStart = -1;
    for (let i = cursorOffset; i >= 0; i--) {
        if (documentText[i] === '<' && documentText[i + 1] !== '/') {
            tagStart = i;
            break;
        }
    }

    if (tagStart === -1) {
        return null;
    }

    // Find the end of the opening tag
    let tagEnd = -1;
    for (let i = tagStart; i < documentText.length; i++) {
        if (documentText[i] === '>') {
            tagEnd = i;
            break;
        }
    }

    if (tagEnd === -1) {
        return null;
    }

    const openingTag = documentText.substring(tagStart, tagEnd + 1);

    // Extract tag name
    const tagNameMatch = openingTag.match(/^<(\w+)/);
    if (!tagNameMatch) {
        return null;
    }

    const tagName = tagNameMatch[1];

    // Extract attributes
    const attributes = new Map<string, string>();
    const attrRegex = /(\w[\w-]*)\s*=\s*["']([^"']*)["']/g;
    let attrMatch;
    while ((attrMatch = attrRegex.exec(openingTag)) !== null) {
        attributes.set(attrMatch[1].toLowerCase(), attrMatch[2]);
    }

    // Check for class
    const hasClass = attributes.has('class');
    const classValue = attributes.get('class');

    return {
        tagName,
        startOffset: tagStart,
        endOffset: tagEnd + 1,
        openingTagEnd: tagEnd,
        hasClass,
        classValue,
        attributes
    };
}

