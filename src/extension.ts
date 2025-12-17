import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('CSS GPS extension is now active!');

    // Register Rule Alpha command
    const ruleAlphaCommand = vscode.commands.registerCommand('cssGps.ruleAlpha', () => {
        vscode.window.showInformationMessage('Rule Alpha executed');
    });

    // Register Rule Beta command
    const ruleBetaCommand = vscode.commands.registerCommand('cssGps.ruleBeta', () => {
        vscode.window.showInformationMessage('Rule Beta executed');
    });

    // Register Rule Gamma command
    const ruleGammaCommand = vscode.commands.registerCommand('cssGps.ruleGamma', () => {
        vscode.window.showInformationMessage('Rule Gamma executed');
    });

    // Register Custom Rules command
    const customRulesCommand = vscode.commands.registerCommand('cssGps.customRules', () => {
        vscode.window.showInformationMessage('Custom Rules panel will open here');
    });

    context.subscriptions.push(
        ruleAlphaCommand,
        ruleBetaCommand,
        ruleGammaCommand,
        customRulesCommand
    );
}

export function deactivate() {}
