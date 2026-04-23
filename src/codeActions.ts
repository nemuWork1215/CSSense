import * as vscode from 'vscode';

export class CssSuppressActionProvider implements vscode.CodeActionProvider {
    static readonly providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range,
        context: vscode.CodeActionContext
    ): vscode.CodeAction[] {
        return context.diagnostics
            .filter(d => d.source === 'CSSense')
            .map(d => this.createIgnoreAction(document, d));
    }

    private createIgnoreAction(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            'この重複を許容する (cssense-ignore を追加)',
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();

        const line = diagnostic.range.start.line;
        // 対象行のインデントに合わせてコメントを挿入
        const indent = document.lineAt(line).text.match(/^\s*/)?.[0] ?? '';
        action.edit.insert(
            document.uri,
            new vscode.Position(line, 0),
            `${indent}/* cssense-ignore */\n`
        );

        return action;
    }
}
