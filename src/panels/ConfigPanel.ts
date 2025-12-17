import * as vscode from 'vscode';

/**
 * Configuration Panel for CSS GPS
 * Shows all options, preset rules, and custom rule management
 */
export class ConfigPanel {
    private static panel: vscode.WebviewPanel | undefined;

    public static show(context: vscode.ExtensionContext): void {
        if (ConfigPanel.panel) {
            ConfigPanel.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        ConfigPanel.panel = vscode.window.createWebviewPanel(
            'cssGpsConfig',
            'CSS GPS - Configuration',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        ConfigPanel.panel.webview.html = ConfigPanel.getWebviewContent();

        // Handle messages from webview
        ConfigPanel.panel.webview.onDidReceiveMessage(
            async (message) => {
                const config = vscode.workspace.getConfiguration('cssGps');
                
                switch (message.command) {
                    case 'loadConfig':
                        await ConfigPanel.sendConfigToWebview();
                        break;
                    case 'saveConfig':
                        await config.update(message.key, message.value, vscode.ConfigurationTarget.Global);
                        vscode.window.showInformationMessage(`Updated: ${message.key}`);
                        break;
                    case 'saveCustomRule':
                        const rules = config.get<any[]>('customRules', []);
                        const existingIndex = rules.findIndex(r => r.id === message.rule.id);
                        if (existingIndex >= 0) {
                            rules[existingIndex] = message.rule;
                        } else {
                            rules.push(message.rule);
                        }
                        await config.update('customRules', rules, vscode.ConfigurationTarget.Global);
                        await ConfigPanel.sendConfigToWebview();
                        vscode.window.showInformationMessage(`Rule "${message.rule.name}" saved!`);
                        break;
                    case 'deleteCustomRule':
                        const currentRules = config.get<any[]>('customRules', []);
                        const filtered = currentRules.filter(r => r.id !== message.ruleId);
                        await config.update('customRules', filtered, vscode.ConfigurationTarget.Global);
                        await ConfigPanel.sendConfigToWebview();
                        vscode.window.showInformationMessage('Rule deleted!');
                        break;
                }
            },
            undefined,
            context.subscriptions
        );

        ConfigPanel.panel.onDidDispose(() => {
            ConfigPanel.panel = undefined;
        });
    }

    private static async sendConfigToWebview(): Promise<void> {
        if (!ConfigPanel.panel) return;

        const config = vscode.workspace.getConfiguration('cssGps');
        
        ConfigPanel.panel.webview.postMessage({
            command: 'configLoaded',
            config: {
                projectPrefix: config.get('projectPrefix', ''),
                pathHashLength: config.get('pathHashLength', 8),
                domHashLength: config.get('domHashLength', 8),
                abbrLength: config.get('abbrLength', 3),
                reversedNameCase: config.get('reversedNameCase', 'lowercase'),
                releases: config.get('releases', []),
                defaultRelease: config.get('defaultRelease', 'stable'),
                customRules: config.get('customRules', []),
            }
        });
    }

    private static getWebviewContent(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CSS GPS Configuration</title>
    <style>
        :root {
            --bg-primary: #1e1e1e;
            --bg-secondary: #252526;
            --bg-tertiary: #2d2d30;
            --bg-hover: #3c3c3c;
            --text-primary: #cccccc;
            --text-secondary: #9d9d9d;
            --text-muted: #6d6d6d;
            --accent: #0e639c;
            --accent-hover: #1177bb;
            --border: #3c3c3c;
            --success: #4ec9b0;
            --warning: #dcdcaa;
            --danger: #f14c4c;
            --code-bg: #1a1a1a;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-primary);
            color: var(--text-primary);
            padding: 20px;
            line-height: 1.6;
        }
        
        .header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid var(--border);
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 600;
            color: #fff;
        }
        
        .header .badge {
            background: var(--accent);
            color: #fff;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
        }
        
        .tabs {
            display: flex;
            gap: 0;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border);
        }
        
        .tab {
            padding: 12px 24px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 14px;
            border-bottom: 2px solid transparent;
            margin-bottom: -1px;
            transition: all 0.2s;
        }
        
        .tab:hover { color: var(--text-primary); }
        .tab.active { color: var(--accent); border-bottom-color: var(--accent); }
        
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        
        .section {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #fff;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .option-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .option-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 8px;
        }
        
        .option-name {
            font-weight: 600;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .option-number {
            background: var(--accent);
            color: #fff;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: 600;
        }
        
        .option-desc {
            color: var(--text-secondary);
            font-size: 13px;
            margin-bottom: 12px;
        }
        
        .option-example {
            background: var(--code-bg);
            padding: 10px 14px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
            color: var(--success);
            margin-bottom: 12px;
        }
        
        .option-config {
            display: flex;
            align-items: center;
            gap: 12px;
            padding-top: 12px;
            border-top: 1px solid var(--border);
        }
        
        .config-label {
            font-size: 13px;
            color: var(--text-secondary);
        }
        
        .config-input {
            padding: 6px 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 13px;
            width: 200px;
        }
        
        .config-input:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .config-input-small {
            width: 80px;
        }
        
        .rule-card {
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 6px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .rule-card.preset {
            border-left: 3px solid var(--warning);
        }
        
        .rule-card.custom {
            border-left: 3px solid var(--success);
        }
        
        .rule-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }
        
        .rule-name {
            font-weight: 600;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .rule-badge {
            font-size: 10px;
            padding: 2px 6px;
            border-radius: 3px;
            text-transform: uppercase;
        }
        
        .rule-badge.preset {
            background: rgba(220, 220, 170, 0.2);
            color: var(--warning);
        }
        
        .rule-badge.custom {
            background: rgba(78, 201, 176, 0.2);
            color: var(--success);
        }
        
        .rule-formula {
            background: var(--code-bg);
            padding: 10px 14px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 12px;
            color: var(--text-primary);
            margin-bottom: 8px;
        }
        
        .rule-formula span {
            color: var(--accent);
        }
        
        .rule-output {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .rule-output code {
            background: var(--code-bg);
            padding: 2px 6px;
            border-radius: 3px;
            color: var(--success);
        }
        
        .btn {
            padding: 8px 16px;
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
            background: var(--bg-hover);
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
        
        .btn-group {
            display: flex;
            gap: 8px;
        }
        
        /* Modal */
        .modal-overlay {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
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
            max-width: 600px;
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
        
        .modal-footer {
            padding: 16px 20px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: flex-end;
            gap: 12px;
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
            padding: 10px 12px;
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
            color: var(--text-muted);
            margin-top: 4px;
        }
        
        .checkbox-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
        }
        
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .checkbox-item:hover {
            border-color: var(--accent);
        }
        
        .checkbox-item.selected {
            border-color: var(--accent);
            background: rgba(14, 99, 156, 0.2);
        }
        
        .checkbox-item input {
            display: none;
        }
        
        .option-tag {
            font-size: 12px;
            padding: 2px 8px;
            background: var(--bg-tertiary);
            border-radius: 3px;
            color: var(--text-secondary);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
        }
        
        .release-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .release-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 14px;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
        }
        
        .release-info {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        
        .release-name {
            font-weight: 500;
            color: #fff;
        }
        
        .release-date {
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .preview-box {
            background: var(--code-bg);
            padding: 16px;
            border-radius: 6px;
            margin-top: 16px;
        }
        
        .preview-label {
            font-size: 11px;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 8px;
        }
        
        .preview-output {
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 14px;
            color: var(--success);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📍 CSS GPS</h1>
        <span class="badge">v1.0.0</span>
    </div>
    
    <div class="tabs">
        <button class="tab active" data-tab="options">Options (7)</button>
        <button class="tab" data-tab="presets">Preset Rules (3)</button>
        <button class="tab" data-tab="custom">Custom Rules</button>
        <button class="tab" data-tab="releases">Releases</button>
    </div>
    
    <!-- OPTIONS TAB -->
    <div id="options" class="tab-content active">
        <div class="section">
            <div class="section-title">📦 Available Options</div>
            
            <!-- Option 1 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">1</span>
                        Project Prefix
                    </div>
                </div>
                <div class="option-desc">Custom text prefix for the entire project (max 50 chars)</div>
                <div class="option-example">PROJECT-SAMPLE</div>
                <div class="option-config">
                    <span class="config-label">Value:</span>
                    <input type="text" class="config-input" id="projectPrefix" placeholder="e.g., my-project" maxlength="50">
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('projectPrefix')">Save</button>
                </div>
            </div>
            
            <!-- Option 2 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">2</span>
                        Path Hash
                    </div>
                </div>
                <div class="option-desc">MD5 hash of the file's relative path from workspace root</div>
                <div class="option-example">a3f2b9c1</div>
                <div class="option-config">
                    <span class="config-label">Hash Length:</span>
                    <input type="number" class="config-input config-input-small" id="pathHashLength" min="4" max="32" value="8">
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('pathHashLength')">Save</button>
                </div>
            </div>
            
            <!-- Option 3 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">3</span>
                        Reversed File Name
                    </div>
                </div>
                <div class="option-desc">File name (without extension) reversed</div>
                <div class="option-example">utility_bill.tpl → llib_ytilitu</div>
                <div class="option-config">
                    <span class="config-label">Case:</span>
                    <select class="config-input" id="reversedNameCase" style="width: 150px;">
                        <option value="lowercase">lowercase</option>
                        <option value="uppercase">UPPERCASE</option>
                        <option value="preserve">Preserve</option>
                    </select>
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('reversedNameCase')">Save</button>
                </div>
            </div>
            
            <!-- Option 4 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">4</span>
                        DOM Hash
                    </div>
                </div>
                <div class="option-desc">MD5 hash of the element's DOM ancestor chain</div>
                <div class="option-example">e7c3a1b9</div>
                <div class="option-config">
                    <span class="config-label">Hash Length:</span>
                    <input type="number" class="config-input config-input-small" id="domHashLength" min="4" max="32" value="8">
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('domHashLength')">Save</button>
                </div>
            </div>
            
            <!-- Option 5 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">5</span>
                        Abbreviated DOM Position
                    </div>
                </div>
                <div class="option-desc">Human-readable DOM path (first 3 chars of each ancestor)</div>
                <div class="option-example">div > section > header > span → div-sec-hea-spa</div>
                <div class="option-config">
                    <span class="config-label">Abbr Length:</span>
                    <input type="number" class="config-input config-input-small" id="abbrLength" min="1" max="10" value="3">
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('abbrLength')">Save</button>
                </div>
            </div>
            
            <!-- Option 6 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">6</span>
                        Abbreviated File Path
                    </div>
                </div>
                <div class="option-desc">Human-readable file path (first 3 chars of each folder/file)</div>
                <div class="option-example">Templates/Admin/users.tpl → tem-adm-use</div>
                <div class="option-config">
                    <span class="config-label">Uses same abbr length as Option 5</span>
                </div>
            </div>
            
            <!-- Option 7 -->
            <div class="option-card">
                <div class="option-header">
                    <div class="option-name">
                        <span class="option-number">7</span>
                        Release Name
                    </div>
                </div>
                <div class="option-desc">Version identifier with expiry dates (see Releases tab)</div>
                <div class="option-example">release-1 (expires: 2026-01-31)</div>
                <div class="option-config">
                    <span class="config-label">Default Release:</span>
                    <input type="text" class="config-input" id="defaultRelease" placeholder="stable" style="width: 150px;">
                    <button class="btn btn-secondary btn-small" onclick="saveConfig('defaultRelease')">Save</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- PRESET RULES TAB -->
    <div id="presets" class="tab-content">
        <div class="section">
            <div class="section-title">🔒 Preset Rules (Read-Only)</div>
            
            <!-- Rule Alpha -->
            <div class="rule-card preset">
                <div class="rule-header">
                    <div class="rule-name">
                        Rule Alpha
                        <span class="rule-badge preset">Preset</span>
                    </div>
                </div>
                <div class="rule-formula">
                    <span>{projectPrefix}</span> -- <span>{abbreviatedFilePath}</span> -- <span>{pathHash}</span>
                </div>
                <div class="rule-output">
                    Example: <code>my-project--tem-adm-use--a3f2b9c1</code>
                </div>
            </div>
            
            <!-- Rule Beta -->
            <div class="rule-card preset">
                <div class="rule-header">
                    <div class="rule-name">
                        Rule Beta
                        <span class="rule-badge preset">Preset</span>
                    </div>
                </div>
                <div class="rule-formula">
                    <span>{projectPrefix}</span> -- <span>{abbreviatedDomPosition}</span> -- <span>{domHash}</span>
                </div>
                <div class="rule-output">
                    Example: <code>my-project--div-sec-hea-spa--e7c3a1b9</code>
                </div>
            </div>
            
            <!-- Rule Gamma -->
            <div class="rule-card preset">
                <div class="rule-header">
                    <div class="rule-name">
                        Rule Gamma
                        <span class="rule-badge preset">Preset</span>
                    </div>
                </div>
                <div class="rule-formula">
                    <span>{projectPrefix}</span> -- <span>{reversedFileName}</span>
                </div>
                <div class="rule-output">
                    Example: <code>my-project--llib_ytilitu</code>
                </div>
            </div>
        </div>
    </div>
    
    <!-- CUSTOM RULES TAB -->
    <div id="custom" class="tab-content">
        <div class="section">
            <div class="section-title" style="justify-content: space-between;">
                <span>⚙️ Custom Rules</span>
                <button class="btn btn-primary" onclick="openRuleModal()">+ Add Rule</button>
            </div>
            
            <div id="customRulesList">
                <div class="empty-state">
                    <p>No custom rules yet</p>
                    <p style="font-size: 12px; margin-top: 8px;">Create your own combinations of options</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- RELEASES TAB -->
    <div id="releases" class="tab-content">
        <div class="section">
            <div class="section-title" style="justify-content: space-between;">
                <span>📅 Release Schedule</span>
                <button class="btn btn-primary" onclick="openReleaseModal()">+ Add Release</button>
            </div>
            
            <div id="releasesList" class="release-list">
                <div class="empty-state">
                    <p>No releases configured</p>
                    <p style="font-size: 12px; margin-top: 8px;">Add releases with expiry dates</p>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Custom Rule Modal -->
    <div class="modal-overlay" id="ruleModal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title" id="ruleModalTitle">Create Custom Rule</h3>
            </div>
            <div class="modal-body">
                <input type="hidden" id="ruleId">
                
                <div class="form-group">
                    <label class="form-label">Rule Name *</label>
                    <input type="text" class="form-input" id="ruleName" placeholder="e.g., My Custom Rule">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Select Options (in order)</label>
                    <div class="checkbox-group" id="optionCheckboxes">
                        <label class="checkbox-item" data-option="projectPrefix">
                            <input type="checkbox" value="projectPrefix">
                            <span class="option-tag">1</span> Project Prefix
                        </label>
                        <label class="checkbox-item" data-option="pathHash">
                            <input type="checkbox" value="pathHash">
                            <span class="option-tag">2</span> Path Hash
                        </label>
                        <label class="checkbox-item" data-option="reversedFileName">
                            <input type="checkbox" value="reversedFileName">
                            <span class="option-tag">3</span> Reversed Name
                        </label>
                        <label class="checkbox-item" data-option="domHash">
                            <input type="checkbox" value="domHash">
                            <span class="option-tag">4</span> DOM Hash
                        </label>
                        <label class="checkbox-item" data-option="abbreviatedDomPosition">
                            <input type="checkbox" value="abbreviatedDomPosition">
                            <span class="option-tag">5</span> Abbr DOM
                        </label>
                        <label class="checkbox-item" data-option="abbreviatedFilePath">
                            <input type="checkbox" value="abbreviatedFilePath">
                            <span class="option-tag">6</span> Abbr Path
                        </label>
                        <label class="checkbox-item" data-option="releaseName">
                            <input type="checkbox" value="releaseName">
                            <span class="option-tag">7</span> Release
                        </label>
                    </div>
                    <p class="form-help">Options will be joined with "--" separator</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Separator</label>
                    <select class="form-input" id="ruleSeparator" style="width: 150px;">
                        <option value="--">-- (double hyphen)</option>
                        <option value="-">- (single hyphen)</option>
                        <option value="__">__ (double underscore)</option>
                        <option value="_">_ (single underscore)</option>
                    </select>
                </div>
                
                <div class="preview-box">
                    <div class="preview-label">Preview</div>
                    <div class="preview-output" id="rulePreview">Select options to see preview</div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeRuleModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveRule()">Save Rule</button>
            </div>
        </div>
    </div>
    
    <!-- Release Modal -->
    <div class="modal-overlay" id="releaseModal">
        <div class="modal">
            <div class="modal-header">
                <h3 class="modal-title">Add Release</h3>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label class="form-label">Release Name *</label>
                    <input type="text" class="form-input" id="releaseName" placeholder="e.g., release-1">
                </div>
                
                <div class="form-group">
                    <label class="form-label">Expiry Date (UTC) *</label>
                    <input type="date" class="form-input" id="releaseExpiry">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="closeReleaseModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveRelease()">Add Release</button>
            </div>
        </div>
    </div>
    
    <script>
        const vscode = acquireVsCodeApi();
        let config = {};
        let selectedOptions = [];
        
        // Initialize
        window.addEventListener('load', () => {
            vscode.postMessage({ command: 'loadConfig' });
        });
        
        // Handle messages
        window.addEventListener('message', event => {
            const message = event.data;
            if (message.command === 'configLoaded') {
                config = message.config;
                updateUI();
            }
        });
        
        // Tab switching
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });
        
        // Checkbox handling
        document.querySelectorAll('.checkbox-item').forEach(item => {
            item.addEventListener('click', () => {
                const checkbox = item.querySelector('input');
                checkbox.checked = !checkbox.checked;
                item.classList.toggle('selected', checkbox.checked);
                updateSelectedOptions();
                updatePreview();
            });
        });
        
        function updateUI() {
            document.getElementById('projectPrefix').value = config.projectPrefix || '';
            document.getElementById('pathHashLength').value = config.pathHashLength || 8;
            document.getElementById('domHashLength').value = config.domHashLength || 8;
            document.getElementById('abbrLength').value = config.abbrLength || 3;
            document.getElementById('reversedNameCase').value = config.reversedNameCase || 'lowercase';
            document.getElementById('defaultRelease').value = config.defaultRelease || 'stable';
            
            renderCustomRules();
            renderReleases();
        }
        
        function saveConfig(key) {
            const input = document.getElementById(key);
            let value = input.value;
            
            if (input.type === 'number') {
                value = parseInt(value, 10);
            }
            
            vscode.postMessage({ command: 'saveConfig', key, value });
        }
        
        function renderCustomRules() {
            const container = document.getElementById('customRulesList');
            const rules = config.customRules || [];
            
            if (rules.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <p>No custom rules yet</p>
                        <p style="font-size: 12px; margin-top: 8px;">Create your own combinations of options</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = rules.map(rule => \`
                <div class="rule-card custom">
                    <div class="rule-header">
                        <div class="rule-name">
                            \${escapeHtml(rule.name)}
                            <span class="rule-badge custom">Custom</span>
                        </div>
                        <div class="btn-group">
                            <button class="btn btn-secondary btn-small" onclick="editRule('\${rule.id}')">Edit</button>
                            <button class="btn btn-danger btn-small" onclick="deleteRule('\${rule.id}')">Delete</button>
                        </div>
                    </div>
                    <div class="rule-formula">
                        \${rule.options.map(o => '<span>{' + o + '}</span>').join(' ' + rule.separator + ' ')}
                    </div>
                </div>
            \`).join('');
        }
        
        function renderReleases() {
            const container = document.getElementById('releasesList');
            const releases = config.releases || [];
            
            if (releases.length === 0) {
                container.innerHTML = \`
                    <div class="empty-state">
                        <p>No releases configured</p>
                        <p style="font-size: 12px; margin-top: 8px;">Add releases with expiry dates</p>
                    </div>
                \`;
                return;
            }
            
            container.innerHTML = releases.map(release => \`
                <div class="release-item">
                    <div class="release-info">
                        <span class="release-name">\${escapeHtml(release.name)}</span>
                        <span class="release-date">Expires: \${release.expiry}</span>
                    </div>
                    <button class="btn btn-danger btn-small" onclick="deleteRelease('\${release.name}')">Delete</button>
                </div>
            \`).join('');
        }
        
        function openRuleModal(ruleId = null) {
            document.getElementById('ruleModalTitle').textContent = ruleId ? 'Edit Custom Rule' : 'Create Custom Rule';
            document.getElementById('ruleId').value = ruleId || '';
            document.getElementById('ruleName').value = '';
            document.getElementById('ruleSeparator').value = '--';
            
            // Reset checkboxes
            document.querySelectorAll('.checkbox-item').forEach(item => {
                item.classList.remove('selected');
                item.querySelector('input').checked = false;
            });
            selectedOptions = [];
            
            if (ruleId) {
                const rule = (config.customRules || []).find(r => r.id === ruleId);
                if (rule) {
                    document.getElementById('ruleName').value = rule.name;
                    document.getElementById('ruleSeparator').value = rule.separator;
                    rule.options.forEach(opt => {
                        const item = document.querySelector(\`.checkbox-item[data-option="\${opt}"]\`);
                        if (item) {
                            item.classList.add('selected');
                            item.querySelector('input').checked = true;
                        }
                    });
                    selectedOptions = [...rule.options];
                }
            }
            
            updatePreview();
            document.getElementById('ruleModal').classList.add('active');
        }
        
        function closeRuleModal() {
            document.getElementById('ruleModal').classList.remove('active');
        }
        
        function updateSelectedOptions() {
            selectedOptions = [];
            document.querySelectorAll('.checkbox-item input:checked').forEach(cb => {
                selectedOptions.push(cb.value);
            });
        }
        
        function updatePreview() {
            const separator = document.getElementById('ruleSeparator').value;
            const preview = document.getElementById('rulePreview');
            
            if (selectedOptions.length === 0) {
                preview.textContent = 'Select options to see preview';
                return;
            }
            
            const examples = {
                projectPrefix: 'my-project',
                pathHash: 'a3f2b9c1',
                reversedFileName: 'llib_ytilitu',
                domHash: 'e7c3a1b9',
                abbreviatedDomPosition: 'div-sec-hea-spa',
                abbreviatedFilePath: 'tem-adm-use',
                releaseName: 'release-1'
            };
            
            const parts = selectedOptions.map(opt => examples[opt] || opt);
            preview.textContent = parts.join(separator);
        }
        
        function saveRule() {
            const name = document.getElementById('ruleName').value.trim();
            const separator = document.getElementById('ruleSeparator').value;
            
            if (!name) {
                alert('Please enter a rule name');
                return;
            }
            
            if (selectedOptions.length === 0) {
                alert('Please select at least one option');
                return;
            }
            
            const rule = {
                id: document.getElementById('ruleId').value || 'rule_' + Date.now(),
                name,
                options: selectedOptions,
                separator
            };
            
            vscode.postMessage({ command: 'saveCustomRule', rule });
            closeRuleModal();
        }
        
        function editRule(ruleId) {
            openRuleModal(ruleId);
        }
        
        function deleteRule(ruleId) {
            if (confirm('Delete this rule?')) {
                vscode.postMessage({ command: 'deleteCustomRule', ruleId });
            }
        }
        
        function openReleaseModal() {
            document.getElementById('releaseName').value = '';
            document.getElementById('releaseExpiry').value = '';
            document.getElementById('releaseModal').classList.add('active');
        }
        
        function closeReleaseModal() {
            document.getElementById('releaseModal').classList.remove('active');
        }
        
        function saveRelease() {
            const name = document.getElementById('releaseName').value.trim();
            const expiry = document.getElementById('releaseExpiry').value;
            
            if (!name || !expiry) {
                alert('Please fill all fields');
                return;
            }
            
            const releases = config.releases || [];
            releases.push({ name, expiry });
            releases.sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
            
            vscode.postMessage({ command: 'saveConfig', key: 'releases', value: releases });
            config.releases = releases;
            renderReleases();
            closeReleaseModal();
        }
        
        function deleteRelease(name) {
            if (confirm('Delete this release?')) {
                const releases = (config.releases || []).filter(r => r.name !== name);
                vscode.postMessage({ command: 'saveConfig', key: 'releases', value: releases });
                config.releases = releases;
                renderReleases();
            }
        }
        
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Update preview on separator change
        document.getElementById('ruleSeparator').addEventListener('change', updatePreview);
    </script>
</body>
</html>`;
    }
}

