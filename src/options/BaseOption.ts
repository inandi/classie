import * as vscode from 'vscode';

/**
 * Base interface for all Classie options
 */
export interface OptionContext {
    /** The VS Code text document */
    document: vscode.TextDocument;
    /** Full file system path */
    filePath: string;
    /** Relative path from workspace root */
    relativePath: string;
    /** File name without extension */
    fileName: string;
    /** File extension (without dot) */
    fileExtension: string;
    /** Offset position of the element in document */
    elementOffset: number;
    /** Full document text */
    documentText: string;
}

/**
 * Base class for all Classie options
 */
export abstract class BaseOption {
    /** Unique identifier for this option */
    abstract readonly id: string;
    
    /** Display name for this option */
    abstract readonly name: string;
    
    /** Short description of what this option generates */
    abstract readonly description: string;

    /**
     * Generate the value for this option
     * @param context The context containing file and element information
     * @returns The generated string value
     */
    abstract generate(context: OptionContext): string;

    /**
     * Get configuration value from VS Code settings
     */
    protected getConfig<T>(key: string, defaultValue: T): T {
        const config = vscode.workspace.getConfiguration('classie');
        return config.get<T>(key, defaultValue);
    }
}

