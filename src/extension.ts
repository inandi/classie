import * as vscode from 'vscode';
import * as path from 'path';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.html', '.tpl', '.phtml'];

// Custom rule interface
interface CustomRule {
    id: string;
    name: string;
    classFormat: string;
    addDataPath: boolean;
    enabled: boolean;
}

// Webview panel for managing rules
let managePanel: vscode.WebviewPanel | undefined;

// Diagnostic collection for hierarchy mismatch warnings
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('CSS GPS extension is now active!');

    // Create diagnostic collection for scan results
    diagnosticCollection = vscode.languages.createDiagnosticCollection('cssGps');
    context.subscriptions.push(diagnosticCollection);

    // Register Rule 1 command
    const rule1Command = vscode.commands.registerCommand('cssGps.rule1', async () => {
        await executeRule1();
    });

    // Register Rule 2 command (placeholder)
    const rule2Command = vscode.commands.registerCommand('cssGps.rule2', async () => {
        vscode.window.showInformationMessage('Rule 2 is coming soon! Stay tuned.');
    });

    // Register Rule 3 command (placeholder)
    const rule3Command = vscode.commands.registerCommand('cssGps.rule3', async () => {
        vscode.window.showInformationMessage('Rule 3 is coming soon! Stay tuned.');
    });

    // Register Scan & Validate command
    const scanCommand = vscode.commands.registerCommand('cssGps.scan', async () => {
        await executeScanAndValidate();
    });

    // Register Manage command
    const manageCommand = vscode.commands.registerCommand('cssGps.manage', () => {
        openManagePanel(context);
    });

    context.subscriptions.push(rule1Command, rule2Command, rule3Command, scanCommand, manageCommand);
}

/**
 * Execute Rule 1: Consolidated Path Naming
 */
async function executeRule1(): Promise<void> {
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
            `CSS Path Namer only works with ${SUPPORTED_EXTENSIONS.join(', ')} files.`
        );
        return;
    }

    // Get configuration
    const config = vscode.workspace.getConfiguration('cssGps');
    const addDataPath = config.get<boolean>('addDataPath', true);

    const cursorPosition = editor.selection.active;
    const documentText = document.getText();

    try {
        // Find the element at cursor position
        const elementInfo = findElementAtPosition(documentText, document.offsetAt(cursorPosition));
        
        if (!elementInfo) {
            vscode.window.showErrorMessage('No HTML element found at cursor position.');
            return;
        }

        // Generate css-gps--file-path from file path
        const dataPath = addDataPath ? generateDataPath(filePath) : null;

        // Generate class name from DOM structure (with filename prefix)
        const domClass = generateDomClassName(documentText, elementInfo.startOffset, filePath);

        // Apply modifications
        await applyModifications(editor, document, elementInfo, dataPath, domClass);

        const message = addDataPath 
            ? `Applied: css-gps--file-path="${dataPath}" class="${domClass}"`
            : `Applied: class="${domClass}"`;
        vscode.window.showInformationMessage(message);
    } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Execute Scan & Validate: Check all CSS GPS elements for hierarchy mismatches
 */
async function executeScanAndValidate(): Promise<void> {
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
            `CSS GPS Scan only works with ${SUPPORTED_EXTENSIONS.join(', ')} files.`
        );
        return;
    }

    const documentText = document.getText();
    const diagnostics: vscode.Diagnostic[] = [];

    // Find all elements with css-gps--file-path attribute
    const cssGpsElements = findAllCssGpsElements(documentText);

    if (cssGpsElements.length === 0) {
        vscode.window.showInformationMessage('No CSS GPS elements found in this file.');
        diagnosticCollection.set(document.uri, []);
        return;
    }

    let mismatchCount = 0;

    for (const element of cssGpsElements) {
        // Calculate what the class SHOULD be based on current DOM hierarchy
        const expectedClass = generateDomClassName(documentText, element.startOffset, filePath);
        
        // Find the CSS GPS class in the element's class list (matches pattern: xxx--yyy)
        const currentCssGpsClass = findCssGpsClass(element.classValue);

        if (currentCssGpsClass && currentCssGpsClass !== expectedClass) {
            mismatchCount++;
            
            // Create a diagnostic for this mismatch
            const startPos = document.positionAt(element.startOffset);
            const endPos = document.positionAt(element.endOffset);
            const range = new vscode.Range(startPos, endPos);

            const diagnostic = new vscode.Diagnostic(
                range,
                `CSS GPS Hierarchy Mismatch!\nCurrent: "${currentCssGpsClass}"\nExpected: "${expectedClass}"`,
                vscode.DiagnosticSeverity.Warning
            );
            diagnostic.source = 'CSS GPS';
            diagnostic.code = 'hierarchy-mismatch';

            diagnostics.push(diagnostic);
        }
    }

    // Set diagnostics for the document
    diagnosticCollection.set(document.uri, diagnostics);

    // Show summary message
    if (mismatchCount === 0) {
        vscode.window.showInformationMessage(
            `✅ CSS GPS Scan Complete: All ${cssGpsElements.length} element(s) have correct hierarchy.`
        );
    } else {
        vscode.window.showWarningMessage(
            `⚠️ CSS GPS Scan Complete: Found ${mismatchCount} hierarchy mismatch(es) out of ${cssGpsElements.length} element(s).`
        );
    }
}

/**
 * Find all elements with css-gps--file-path attribute
 */
interface CssGpsElement {
    tagName: string;
    startOffset: number;
    endOffset: number;
    classValue: string;
    filePathValue: string;
}

function findAllCssGpsElements(documentText: string): CssGpsElement[] {
    const elements: CssGpsElement[] = [];
    
    // Regex to find opening tags with css-gps--file-path attribute
    const tagRegex = /<(\w+)([^>]*css-gps--file-path\s*=\s*["']([^"']*)["'][^>]*)>/gi;
    
    let match;
    while ((match = tagRegex.exec(documentText)) !== null) {
        const fullMatch = match[0];
        const tagName = match[1];
        const attributes = match[2];
        const filePathValue = match[3];
        
        // Extract class value from attributes
        const classMatch = attributes.match(/class\s*=\s*["']([^"']*)["']/i);
        const classValue = classMatch ? classMatch[1] : '';
        
        elements.push({
            tagName,
            startOffset: match.index,
            endOffset: match.index + fullMatch.length,
            classValue,
            filePathValue
        });
    }
    
    return elements;
}

/**
 * Find the CSS GPS class from a class list (matches pattern: xxx--yyy-zzz)
 */
function findCssGpsClass(classValue: string): string | null {
    if (!classValue) return null;
    
    const classes = classValue.split(/\s+/);
    
    // CSS GPS classes follow the pattern: filename--dom-path (e.g., "sam--div-div-sec")
    // They have a double hyphen separating filename from DOM path
    for (const cls of classes) {
        if (cls.match(/^[a-z]{1,3}--[a-z]{1,3}(-[a-z]{1,3})*$/)) {
            return cls;
        }
    }
    
    return null;
}

/**
 * Open the Manage Custom Rules panel
 */
function openManagePanel(context: vscode.ExtensionContext): void {
    if (managePanel) {
        managePanel.reveal(vscode.ViewColumn.One);
        return;
    }

    managePanel = vscode.window.createWebviewPanel(
        'cssGpsManage',
        'CSS GPS - Manage Rules',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    managePanel.webview.html = getManageWebviewContent();

    // Handle messages from webview
    managePanel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.command) {
                case 'loadRules':
                    await sendRulesToWebview();
                    break;
                case 'saveRule':
                    await saveCustomRule(message.rule, message.scope);
                    await sendRulesToWebview();
                    vscode.window.showInformationMessage(`Rule "${message.rule.name}" saved successfully!`);
                    break;
                case 'deleteRule':
                    await deleteCustomRule(message.ruleId, message.scope);
                    await sendRulesToWebview();
                    vscode.window.showInformationMessage('Rule deleted successfully!');
                    break;
                case 'updateDefaultDataPath':
                    const config = vscode.workspace.getConfiguration('cssGps');
                    await config.update('addDataPath', message.value, vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`Default css-gps--file-path setting updated to: ${message.value}`);
                    break;
            }
        },
        undefined,
        context.subscriptions
    );

    managePanel.onDidDispose(() => {
        managePanel = undefined;
    });
}

/**
 * Send current rules to webview
 */
async function sendRulesToWebview(): Promise<void> {
    if (!managePanel) return;

    const config = vscode.workspace.getConfiguration('cssGps');
    const globalRules = config.get<CustomRule[]>('globalCustomRules', []);
    const localRules = config.get<CustomRule[]>('localCustomRules', []);
    const addDataPath = config.get<boolean>('addDataPath', true);

    managePanel.webview.postMessage({
        command: 'rulesLoaded',
        globalRules,
        localRules,
        addDataPath
    });
}

/**
 * Save a custom rule
 */
async function saveCustomRule(rule: CustomRule, scope: 'global' | 'local'): Promise<void> {
    const config = vscode.workspace.getConfiguration('cssGps');
    const configKey = scope === 'global' ? 'globalCustomRules' : 'localCustomRules';
    const target = scope === 'global' ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
    
    const rules = config.get<CustomRule[]>(configKey, []);
    const existingIndex = rules.findIndex(r => r.id === rule.id);
    
    if (existingIndex >= 0) {
        rules[existingIndex] = rule;
    } else {
        rules.push(rule);
    }
    
    await config.update(configKey, rules, target);
}

/**
 * Delete a custom rule
 */
async function deleteCustomRule(ruleId: string, scope: 'global' | 'local'): Promise<void> {
    const config = vscode.workspace.getConfiguration('cssGps');
    const configKey = scope === 'global' ? 'globalCustomRules' : 'localCustomRules';
    const target = scope === 'global' ? vscode.ConfigurationTarget.Global : vscode.ConfigurationTarget.Workspace;
    
    const rules = config.get<CustomRule[]>(configKey, []);
    const filteredRules = rules.filter(r => r.id !== ruleId);
    
    await config.update(configKey, filteredRules, target);
}

/**
 * Get the HTML content for the Manage webview
 */
function getManageWebviewContent(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS GPS - Manage Rules</title>
    <style>
        :root {
            --bg-primary: #1e1e1e;
            --bg-secondary: #252526;
            --bg-tertiary: #2d2d30;
            --text-primary: #cccccc;
            --text-secondary: #9d9d9d;
            --accent: #0e639c;
            --accent-hover: #1177bb;
            --border: #3c3c3c;
            --success: #4ec9b0;
            --danger: #f14c4c;
            --warning: #cca700;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 24px;
            line-height: 1.5;
        }
        
        h1 {
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #fff;
        }
        
        .subtitle {
            color: var(--text-secondary);
            margin-bottom: 24px;
        }
        
        .section {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
        }
        
        .toggle-container {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .toggle-label {
            font-size: 14px;
        }
        
        .toggle {
            position: relative;
            width: 44px;
            height: 24px;
        }
        
        .toggle input {
            opacity: 0;
            width: 0;
            height: 0;
        }
        
        .toggle-slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: var(--bg-tertiary);
            transition: 0.3s;
            border-radius: 24px;
            border: 1px solid var(--border);
        }
        
        .toggle-slider:before {
            position: absolute;
            content: "";
            height: 18px;
            width: 18px;
            left: 2px;
            bottom: 2px;
            background-color: var(--text-secondary);
            transition: 0.3s;
            border-radius: 50%;
        }
        
        .toggle input:checked + .toggle-slider {
            background-color: var(--accent);
            border-color: var(--accent);
        }
        
        .toggle input:checked + .toggle-slider:before {
            transform: translateX(20px);
            background-color: #fff;
        }
        
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }
        
        .tab {
            padding: 10px 20px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 14px;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: all 0.2s;
        }
        
        .tab:hover {
            color: var(--text-primary);
        }
        
        .tab.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
        }
        
        .rules-list {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .rule-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 16px;
        }
        
        .rule-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .rule-name {
            font-weight: 600;
            color: #fff;
        }
        
        .rule-actions {
            display: flex;
            gap: 8px;
        }
        
        .rule-format {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            background: var(--bg-primary);
            padding: 8px 12px;
            border-radius: 4px;
            margin-bottom: 8px;
            color: var(--success);
        }
        
        .rule-meta {
            display: flex;
            gap: 16px;
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .btn {
            padding: 6px 14px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        
        .btn-primary {
            background: var(--accent);
            color: #fff;
        }
        
        .btn-primary:hover {
            background: var(--accent-hover);
        }
        
        .btn-secondary {
            background: var(--bg-tertiary);
            color: var(--text-primary);
            border: 1px solid var(--border);
        }
        
        .btn-secondary:hover {
            background: var(--border);
        }
        
        .btn-danger {
            background: transparent;
            color: var(--danger);
            border: 1px solid var(--danger);
        }
        
        .btn-danger:hover {
            background: var(--danger);
            color: #fff;
        }
        
        .btn-small {
            padding: 4px 10px;
            font-size: 12px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 12px;
            opacity: 0.5;
        }
        
        /* Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 100;
            align-items: center;
            justify-content: center;
        }
        
        .modal-overlay.active {
            display: flex;
        }
        
        .modal {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            width: 100%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .modal-header {
            padding: 20px;
            border-bottom: 1px solid var(--border);
        }
        
        .modal-title {
            font-size: 18px;
            font-weight: 600;
            color: #fff;
        }
        
        .modal-body {
            padding: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 500;
            margin-bottom: 6px;
            color: var(--text-primary);
        }
        
        .form-input {
            width: 100%;
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 14px;
        }
        
        .form-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .form-help {
            font-size: 12px;
            color: var(--text-secondary);
            margin-top: 4px;
        }
        
        .form-select {
            width: 100%;
            padding: 8px 12px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 14px;
        }
        
        .modal-footer {
            padding: 16px 20px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: 500;
        }
        
        .badge-enabled {
            background: rgba(78, 201, 176, 0.2);
            color: var(--success);
        }
        
        .badge-disabled {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-secondary);
        }
    </style>
</head>
<body>
    <h1>📍 CSS GPS</h1>
    <p class="subtitle">Manage your custom naming rules</p>
    
    <!-- Default Settings Section -->
    <div class="section">
        <div class="section-header">
            <span class="section-title">Default Settings</span>
        </div>
        <div class="toggle-container">
            <span class="toggle-label">Add css-gps--file-path attribute by default</span>
            <label class="toggle">
                <input type="checkbox" id="defaultDataPath" checked>
                <span class="toggle-slider"></span>
            </label>
        </div>
    </div>
    
    <!-- Custom Rules Section -->
    <div class="section">
        <div class="section-header">
            <span class="section-title">Custom Rules</span>
            <button class="btn btn-primary" onclick="openCreateModal()">+ New Rule</button>
        </div>
        
        <div class="tabs">
            <button class="tab active" data-scope="global" onclick="switchTab('global')">Global Rules</button>
            <button class="tab" data-scope="local" onclick="switchTab('local')">Project Rules</button>
        </div>
        
        <div id="globalRules" class="rules-list">
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <p>No global rules yet</p>
                <p style="font-size: 12px;">Global rules apply to all projects</p>
            </div>
        </div>
        
        <div id="localRules" class="rules-list" style="display: none;">
            <div class="empty-state">
                <div class="empty-state-icon">📁</div>
                <p>No project rules yet</p>
                <p style="font-size: 12px;">Project rules only apply to this workspace</p>
            </div>
        </div>
    </div>
    
    <!-- Create/Edit Rule Modal -->
    <div class="modal-overlay" id="ruleModal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" id="modalTitle">Create New Rule</h3>
            </div>
            <div class="modal-body">
                <input type="hidden" id="ruleId">
                
                <div class="form-group">
                    <label class="form-label">Rule Name *</label>
                    <input type="text" class="form-input" id="ruleName" placeholder="e.g., BEM Style Naming">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Class Format Pattern *</label>
                    <input type="text" class="form-input" id="ruleFormat" placeholder="e.g., {filename}__{dom-path}">
                    <p class="form-help">
                        Available placeholders: {filename}, {dom-path}, {css-gps--file-path}, {tag}
                    </p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Scope</label>
                    <select class="form-select" id="ruleScope">
                        <option value="global">Global (All Projects)</option>
                        <option value="local">Local (This Project Only)</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <div class="toggle-container">
                        <span class="toggle-label">Add css-gps--file-path attribute</span>
                        <label class="toggle">
                            <input type="checkbox" id="ruleDataPath" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="toggle-container">
                        <span class="toggle-label">Enabled</span>
                        <label class="toggle">
                            <input type="checkbox" id="ruleEnabled" checked>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveRule()">Save Rule</button>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let currentScope = 'global';
        let globalRules = [];
        let localRules = [];
        
        // Initialize
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'loadRules' });
        });
        
        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'rulesLoaded') {
                globalRules = message.globalRules || [];
                localRules = message.localRules || [];
                document.getElementById('defaultDataPath').checked = message.addDataPath;
                renderRules();
            }
        });
        
        // Default css-gps--file-path toggle
        document.getElementById('defaultDataPath').addEventListener('change', (e) => {
            vscode.postMessage({
                command: 'updateDefaultDataPath',
                value: e.target.checked
            });
        });
        
        function switchTab(scope) {
            currentScope = scope;
            document.querySelectorAll('.tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.scope === scope);
            });
            document.getElementById('globalRules').style.display = scope === 'global' ? 'flex' : 'none';
            document.getElementById('localRules').style.display = scope === 'local' ? 'flex' : 'none';
        }
        
        function renderRules() {
            renderRulesList('globalRules', globalRules, 'global');
            renderRulesList('localRules', localRules, 'local');
        }
        
        function renderRulesList(containerId, rules, scope) {
            const container = document.getElementById(containerId);
            
            if (rules.length === 0) {
                const emptyText = scope === 'global' ? 'Global rules apply to all projects' : 'Project rules only apply to this workspace';
                container.innerHTML = \`
                    <div class="empty-state">
                        <div class="empty-state-icon">\${scope === 'global' ? '📋' : '📁'}</div>
                        <p>No \${scope} rules yet</p>
                        <p style="font-size: 12px;">\${emptyText}</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = rules.map(rule => \`
                <div class="rule-card">
                    <div class="rule-header">
                        <span class="rule-name">\${escapeHtml(rule.name)}</span>
                        <div class="rule-actions">
                            <button class="btn btn-secondary btn-small" onclick="editRule('\${rule.id}', '\${scope}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteRule('\${rule.id}', '\${scope}')">Delete</button>
                        </div>
                    </div>
                    <div class="rule-format">\${escapeHtml(rule.classFormat)}</div>
                    <div class="rule-meta">
                        <span>Data-path: \${rule.addDataPath ? 'Yes' : 'No'}</span>
                        <span class="badge \${rule.enabled ? 'badge-enabled' : 'badge-disabled'}">\${rule.enabled ? 'Enabled' : 'Disabled'}</span>
                    </div>
                </div>
            \`).join('');
        }
        
        function openCreateModal() {
            document.getElementById('modalTitle').textContent = 'Create New Rule';
            document.getElementById('ruleId').value = '';
            document.getElementById('ruleName').value = '';
            document.getElementById('ruleFormat').value = '';
            document.getElementById('ruleScope').value = currentScope;
            document.getElementById('ruleDataPath').checked = true;
            document.getElementById('ruleEnabled').checked = true;
            document.getElementById('ruleModal').classList.add('active');
        }
        
        function editRule(ruleId, scope) {
            const rules = scope === 'global' ? globalRules : localRules;
            const rule = rules.find(r => r.id === ruleId);
            if (!rule) return;
            
            document.getElementById('modalTitle').textContent = 'Edit Rule';
            document.getElementById('ruleId').value = rule.id;
            document.getElementById('ruleName').value = rule.name;
            document.getElementById('ruleFormat').value = rule.classFormat;
            document.getElementById('ruleScope').value = scope;
            document.getElementById('ruleDataPath').checked = rule.addDataPath;
            document.getElementById('ruleEnabled').checked = rule.enabled;
            document.getElementById('ruleModal').classList.add('active');
        }
        
        function closeModal() {
            document.getElementById('ruleModal').classList.remove('active');
        }
        
        function saveRule() {
            const name = document.getElementById('ruleName').value.trim();
            const classFormat = document.getElementById('ruleFormat').value.trim();
            const scope = document.getElementById('ruleScope').value;
            
            if (!name || !classFormat) {
                alert('Please fill in all required fields');
                return;
            }
            
            const rule = {
                id: document.getElementById('ruleId').value || generateId(),
                name: name,
                classFormat: classFormat,
                addDataPath: document.getElementById('ruleDataPath').checked,
                enabled: document.getElementById('ruleEnabled').checked
            };
            
            vscode.postMessage({
                command: 'saveRule',
                rule: rule,
                scope: scope
            });
            
            closeModal();
        }
        
        function deleteRule(ruleId, scope) {
            if (confirm('Are you sure you want to delete this rule?')) {
                vscode.postMessage({
                    command: 'deleteRule',
                    ruleId: ruleId,
                    scope: scope
                });
            }
        }
        
        function generateId() {
            return 'rule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    </script>
</body>
</html>`;
}

interface ElementInfo {
    tagName: string;
    startOffset: number;
    endOffset: number;
    openingTagEnd: number;
    hasClass: boolean;
    classAttributeStart?: number;
    classAttributeEnd?: number;
    classValue?: string;
    hasDataPath: boolean;
    dataPathAttributeStart?: number;
    dataPathAttributeEnd?: number;
}

/**
 * Find the HTML element at the given cursor position
 */
function findElementAtPosition(documentText: string, cursorOffset: number): ElementInfo | null {
    // Find the opening tag that contains the cursor
    let tagStart = -1;
    let tagEnd = -1;
    
    // Search backwards for '<'
    for (let i = cursorOffset; i >= 0; i--) {
        if (documentText[i] === '<' && documentText[i + 1] !== '/') {
            tagStart = i;
            break;
        }
        // If we hit a '>' before finding '<', we're not inside a tag, keep searching
        if (documentText[i] === '>' && i < cursorOffset) {
            // Continue searching backwards for the containing element
            continue;
        }
    }

    if (tagStart === -1) {
        return null;
    }

    // Find the end of the opening tag
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

    // Check for existing class attribute
    const classMatch = openingTag.match(/\sclass\s*=\s*["']([^"']*)["']/);
    const hasClass = classMatch !== null;
    let classAttributeStart: number | undefined;
    let classAttributeEnd: number | undefined;
    let classValue: string | undefined;

    if (hasClass && classMatch) {
        classValue = classMatch[1];
        const classIndex = openingTag.indexOf(classMatch[0]);
        classAttributeStart = tagStart + classIndex;
        classAttributeEnd = classAttributeStart + classMatch[0].length;
    }

    // Check for existing css-gps--file-path attribute
    const dataPathMatch = openingTag.match(/\scss-gps--file-path\s*=\s*["'][^"']*["']/);
    const hasDataPath = dataPathMatch !== null;
    let dataPathAttributeStart: number | undefined;
    let dataPathAttributeEnd: number | undefined;

    if (hasDataPath && dataPathMatch) {
        const dataPathIndex = openingTag.indexOf(dataPathMatch[0]);
        dataPathAttributeStart = tagStart + dataPathIndex;
        dataPathAttributeEnd = dataPathAttributeStart + dataPathMatch[0].length;
    }

    return {
        tagName,
        startOffset: tagStart,
        endOffset: tagEnd + 1,
        openingTagEnd: tagEnd,
        hasClass,
        classAttributeStart,
        classAttributeEnd,
        classValue,
        hasDataPath,
        dataPathAttributeStart,
        dataPathAttributeEnd
    };
}

/**
 * Generate css-gps--file-path attribute value from file path
 * Extracts first 3 characters of each folder name and the base filename
 */
function generateDataPath(filePath: string): string {
    // Normalize path separators
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Split path into segments
    const segments = normalizedPath.split('/');
    
    // Find meaningful path segments (skip drive letter on Windows, common root folders)
    const meaningfulSegments: string[] = [];
    let foundMeaningfulStart = false;
    
    for (const segment of segments) {
        // Skip empty segments and common root paths
        if (!segment || segment.match(/^[A-Za-z]:$/)) {
            continue;
        }
        
        // Start capturing after common development folder patterns
        const commonRoots = ['www', 'htdocs', 'public_html', 'src', 'app', 'workspace', 'projects'];
        if (!foundMeaningfulStart && commonRoots.some(root => 
            segment.toLowerCase() === root.toLowerCase())) {
            foundMeaningfulStart = true;
            continue;
        }
        
        // If we haven't found a common root, start from Interfaces, Templates, etc.
        if (!foundMeaningfulStart && 
            (segment === 'Interfaces' || segment === 'Templates' || segment === 'views' || segment === 'templates')) {
            foundMeaningfulStart = true;
        }
        
        if (foundMeaningfulStart || meaningfulSegments.length > 0 || 
            segment === 'Interfaces' || segment === 'Templates') {
            meaningfulSegments.push(segment);
        }
    }

    // If no meaningful segments found, use all segments except drive
    if (meaningfulSegments.length === 0) {
        for (const segment of segments) {
            if (segment && !segment.match(/^[A-Za-z]:$/)) {
                meaningfulSegments.push(segment);
            }
        }
    }

    // Process segments: first 3 chars of each, lowercase
    const processedSegments = meaningfulSegments.map(segment => {
        // Remove file extension from last segment (filename)
        const cleanSegment = segment.replace(/\.[^/.]+$/, '');
        // Take first 3 characters, lowercase
        return cleanSegment.substring(0, 3).toLowerCase();
    });

    return processedSegments.join('-');
}

/**
 * Generate class name from DOM structure (ancestor path)
 * Format: filename--div-div-sec-hea-div-spa
 * Extracts first 3 characters of each ancestor tag name, prefixed with filename
 */
function generateDomClassName(documentText: string, elementOffset: number, filePath: string): string {
    const ancestors: string[] = [];
    const tagStack: { tagName: string; offset: number }[] = [];
    
    // Extract filename (without extension), take first 3 chars, and convert to lowercase
    const fileName = path.basename(filePath).replace(/\.[^/.]+$/, '').substring(0, 3).toLowerCase();
    
    // Parse the document up to the element's position to build ancestor chain
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
                const isSelfClosing = tagMatch[3] === '/' || isSelfClosingTag(tagName);
                
                if (!isSelfClosing) {
                    tagStack.push({ tagName, offset: i });
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
                    if (tagStack[j].tagName === closingTagName) {
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
    const currentTagName = currentTagMatch ? currentTagMatch[1].toLowerCase() : '';

    // Build ancestor path (excluding html, head, body as they're too generic)
    const excludeTags = ['html', 'head', 'body', 'script', 'style'];
    
    for (const item of tagStack) {
        if (!excludeTags.includes(item.tagName)) {
            ancestors.push(item.tagName);
        }
    }

    // Add current element's tag
    if (currentTagName && !excludeTags.includes(currentTagName)) {
        ancestors.push(currentTagName);
    }

    // Take first 3 characters of each tag name
    const classSegments = ancestors.map(tag => tag.substring(0, 3).toLowerCase());
    const domPath = classSegments.join('-');

    // Return filename--dom-path format
    return `${fileName}--${domPath}`;
}

/**
 * Check if a tag is self-closing
 */
function isSelfClosingTag(tagName: string): boolean {
    const selfClosingTags = [
        'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
        'link', 'meta', 'param', 'source', 'track', 'wbr'
    ];
    return selfClosingTags.includes(tagName.toLowerCase());
}

/**
 * Apply the css-gps--file-path and class modifications to the element
 */
async function applyModifications(
    editor: vscode.TextEditor,
    document: vscode.TextDocument,
    elementInfo: ElementInfo,
    dataPath: string | null,
    domClass: string
): Promise<void> {
    await editor.edit(editBuilder => {
        const openingTag = document.getText(new vscode.Range(
            document.positionAt(elementInfo.startOffset),
            document.positionAt(elementInfo.endOffset)
        ));

        let newOpeningTag = openingTag;

        // Handle class attribute
        if (elementInfo.hasClass && elementInfo.classValue !== undefined) {
            // Check if domClass already exists in class
            const existingClasses = elementInfo.classValue.split(/\s+/);
            if (!existingClasses.includes(domClass)) {
                // Append new class to existing
                const newClassValue = `${elementInfo.classValue} ${domClass}`;
                newOpeningTag = newOpeningTag.replace(
                    /(\sclass\s*=\s*["'])([^"']*)(["'])/,
                    `$1${newClassValue}$3`
                );
            }
        } else {
            // Add new class attribute before the closing >
            const insertPosition = newOpeningTag.lastIndexOf('>');
            newOpeningTag = newOpeningTag.substring(0, insertPosition) + 
                ` class="${domClass}"` + 
                newOpeningTag.substring(insertPosition);
        }

        // Handle css-gps--file-path attribute (only if enabled)
        if (dataPath !== null) {
            if (elementInfo.hasDataPath) {
                // Update existing css-gps--file-path
                newOpeningTag = newOpeningTag.replace(
                    /(\scss-gps--file-path\s*=\s*["'])[^"']*(["'])/,
                    `$1${dataPath}$2`
                );
            } else {
                // Add new css-gps--file-path attribute
                const insertPosition = newOpeningTag.lastIndexOf('>');
                newOpeningTag = newOpeningTag.substring(0, insertPosition) + 
                    ` css-gps--file-path="${dataPath}"` + 
                    newOpeningTag.substring(insertPosition);
            }
        }

        // Replace the opening tag
        const range = new vscode.Range(
            document.positionAt(elementInfo.startOffset),
            document.positionAt(elementInfo.endOffset)
        );
        editBuilder.replace(range, newOpeningTag);
    });
}

export function deactivate() {}
