import * as vscode from 'vscode';
import { CssCompletionProvider } from './completionProvider';
import { CssDefinitionProvider } from './definitionProvider';
import { CssSuppressActionProvider } from './codeActions';
import { diagnosticCollection, refreshDiagnostics } from './diagnostics';
import { invalidateCache } from './htmlParser';

const CSS_SELECTOR = [
    { language: 'css' },
    { language: 'scss' },
    { language: 'less' },
];

export function activate(context: vscode.ExtensionContext): void {
    // セレクタ補完 (. と # をトリガー文字に追加)
    const completion = vscode.languages.registerCompletionItemProvider(
        CSS_SELECTOR,
        new CssCompletionProvider(),
        '.', '#'
    );

    // 定義へ移動 (F12 / Ctrl+Click)
    const definition = vscode.languages.registerDefinitionProvider(
        CSS_SELECTOR,
        new CssDefinitionProvider()
    );

    // 重複セレクタのクイックアクション
    const codeAction = vscode.languages.registerCodeActionsProvider(
        CSS_SELECTOR,
        new CssSuppressActionProvider(),
        { providedCodeActionKinds: CssSuppressActionProvider.providedCodeActionKinds }
    );

    // HTMLファイルが変更されたらキャッシュを無効化
    const onHtmlChange = vscode.workspace.onDidChangeTextDocument(e => {
        const lang = e.document.languageId;
        if (lang === 'html') {
            // CSSファイルのキャッシュをすべて破棄 (どのCSSがリンクされているか不明なため)
            vscode.workspace.textDocuments
                .filter(d => ['css', 'scss', 'less'].includes(d.languageId))
                .forEach(d => invalidateCache(d.uri));
        }
        if (['css', 'scss', 'less'].includes(lang)) {
            refreshDiagnostics(e.document);
        }
    });

    const onOpen = vscode.workspace.onDidOpenTextDocument(refreshDiagnostics);
    const onClose = vscode.workspace.onDidCloseTextDocument(d => diagnosticCollection.delete(d.uri));

    // 起動時にすでに開いているCSSファイルを処理
    vscode.workspace.textDocuments.forEach(refreshDiagnostics);

    context.subscriptions.push(
        completion,
        definition,
        codeAction,
        diagnosticCollection,
        onHtmlChange,
        onOpen,
        onClose,
    );
}

export function deactivate(): void { /* nothing to clean up */ }
