import * as vscode from 'vscode';
import * as path from 'path';
import { PresetRules } from './rules';
import { OptionContext, getOptionById } from './options';
import { findElementAtPosition } from './utils/domParser';
import { ConfigPanel } from './panels';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.html', '.tpl', '.phtml'];

// Store for custom rule disposables
let customRuleDisposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
    console.log('CSS GPS extension is now active!');

    // Register Rule Alpha command
    const ruleAlphaCommand = vscode.commands.registerCommand('cssGps.ruleAlpha', async () => {
        await executeRule(PresetRules.alpha);
    });

    // Register Rule Beta command
    const ruleBetaCommand = vscode.commands.registerCommand('cssGps.ruleBeta', async () => {
        await executeRule(PresetRules.beta);
    });

    // Register Rule Gamma command
    const ruleGammaCommand = vscode.commands.registerCommand('cssGps.ruleGamma', async () => {
        await executeRule(PresetRules.gamma);
    });

    // Register Manage Rules command (opens config panel)
    const manageRulesCommand = vscode.commands.registerCommand('cssGps.manageRules', () => {
        ConfigPanel.show(context);
    });

    // Register dynamic custom rule commands
    registerCustomRuleCommands(context);

    context.subscriptions.push(
        ruleAlphaCommand,
        ruleBetaCommand,
        ruleGammaCommand,
        manageRulesCommand
    );
}

/**
 * Execute a rule on the current element
 */
async function executeRule(rule: { name: string; generate: (context: OptionContext) => string }): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;
    const fileExtension = path.extname(filePath).toLowerCase();

    // Check if file type is supported
    if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        vscode.window.showErrorMessage(
            `CSS GPS only works with ${SUPPORTED_EXTENSIONS.join(', ')} files.`
        );
        return;
    }

    const cursorPosition = editor.selection.active;
    const documentText = document.getText();
    const cursorOffset = document.offsetAt(cursorPosition);

        // Find the element at cursor position
    const elementInfo = findElementAtPosition(documentText, cursorOffset);
        
        if (!elementInfo) {
            vscode.window.showErrorMessage('No HTML element found at cursor position.');
            return;
        }

    // Build the option context
    const context = buildOptionContext(document, filePath, cursorOffset, documentText);

    // Generate class name using the rule
    const generatedClass = rule.generate(context);

    if (!generatedClass) {
        vscode.window.showErrorMessage('Could not generate class name. Check your settings.');
        return;
    }

    // Apply the class to the element
    await applyClassToElement(editor, document, elementInfo, generatedClass);

    vscode.window.showInformationMessage(`${rule.name}: Applied class "${generatedClass}"`);
}

/**
 * Build the OptionContext from document information
 */
function buildOptionContext(
    document: vscode.TextDocument,
    filePath: string,
    elementOffset: number,
    documentText: string
): OptionContext {
    // Get workspace folder for relative path
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    let relativePath = filePath;
    
    if (workspaceFolder) {
        relativePath = path.relative(workspaceFolder.uri.fsPath, filePath);
    }

    // Extract file name and extension
    const fullFileName = path.basename(filePath);
    const fileExtension = path.extname(filePath).substring(1); // Remove leading dot
    const fileName = fullFileName.replace(/\.[^/.]+$/, ''); // Remove extension

    return {
        document,
        filePath,
        relativePath,
        fileName,
        fileExtension,
        elementOffset,
        documentText,
    };
}

/**
 * Apply a class to an HTML element
 */
async function applyClassToElement(
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    elementInfo: ReturnType<typeof findElementAtPosition>,
    newClass: string
): Promise<void> {
    if (!elementInfo) return;

    await editor.edit(editBuilder => {
        const openingTag = document.getText(new vscode.Range(
            document.positionAt(elementInfo.startOffset),
            document.positionAt(elementInfo.endOffset)
        ));

        let newOpeningTag: string;

        if (elementInfo.hasClass && elementInfo.classValue !== undefined) {
            // Check if class already exists
            const existingClasses = elementInfo.classValue.split(/\s+/);
            if (existingClasses.includes(newClass)) {
                return; // Class already exists
            }

                // Append new class to existing
            const newClassValue = `${elementInfo.classValue} ${newClass}`;
            newOpeningTag = openingTag.replace(
                    /(\sclass\s*=\s*["'])([^"']*)(["'])/,
                    `$1${newClassValue}$3`
                );
        } else {
            // Add new class attribute before the closing >
            const insertPosition = openingTag.lastIndexOf('>');
            newOpeningTag = openingTag.substring(0, insertPosition) +
                ` class="${newClass}"` +
                openingTag.substring(insertPosition);
        }

        // Replace the opening tag
        const range = new vscode.Range(
            document.positionAt(elementInfo.startOffset),
            document.positionAt(elementInfo.endOffset)
        );
        editBuilder.replace(range, newOpeningTag);
    });
}

/**
 * Register commands for custom rules from settings
 */
function registerCustomRuleCommands(context: vscode.ExtensionContext): void {
    // Clear existing custom rule commands
    customRuleDisposables.forEach(d => d.dispose());
    customRuleDisposables = [];

    const config = vscode.workspace.getConfiguration('cssGps');
    const customRules = config.get<CustomRuleConfig[]>('customRules', []);

    customRules.forEach((rule, index) => {
        const commandId = `cssGps.customRule.${rule.id}`;
        
        const disposable = vscode.commands.registerCommand(commandId, async () => {
            await executeCustomRule(rule);
        });

        customRuleDisposables.push(disposable);
        context.subscriptions.push(disposable);
    });

    // Listen for configuration changes to re-register commands
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('cssGps.customRules')) {
                registerCustomRuleCommands(context);
            }
        })
    );
}

/**
 * Custom rule configuration interface
 */
interface CustomRuleConfig {
    id: string;
    name: string;
    options: string[];
    separator: string;
}

/**
 * Execute a custom rule
 */
async function executeCustomRule(ruleConfig: CustomRuleConfig): Promise<void> {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
        vscode.window.showErrorMessage('No active editor found.');
        return;
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;
    const fileExtension = path.extname(filePath).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.includes(fileExtension)) {
        vscode.window.showErrorMessage(
            `CSS GPS only works with ${SUPPORTED_EXTENSIONS.join(', ')} files.`
        );
        return;
    }

    const cursorPosition = editor.selection.active;
    const documentText = document.getText();
    const cursorOffset = document.offsetAt(cursorPosition);

    const elementInfo = findElementAtPosition(documentText, cursorOffset);

    if (!elementInfo) {
        vscode.window.showErrorMessage('No HTML element found at cursor position.');
        return;
    }

    const context = buildOptionContext(document, filePath, cursorOffset, documentText);

    // Generate class from custom rule options
    const parts: string[] = [];
    for (const optionId of ruleConfig.options) {
        const option = getOptionById(optionId);
        if (option) {
            const value = option.generate(context);
            if (value) {
                parts.push(value);
            }
        }
    }

    const generatedClass = parts.join(ruleConfig.separator);

    if (!generatedClass) {
        vscode.window.showErrorMessage('Could not generate class name. Check your settings.');
        return;
    }

    await applyClassToElement(editor, document, elementInfo, generatedClass);
    vscode.window.showInformationMessage(`${ruleConfig.name}: Applied class "${generatedClass}"`);
}

export function deactivate() {
    customRuleDisposables.forEach(d => d.dispose());
}
