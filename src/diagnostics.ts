import * as vscode from 'vscode';
import { parseCssSelectors, CssSelectorInfo } from './cssParser';

export const diagnosticCollection = vscode.languages.createDiagnosticCollection('cssense');

const CSS_LANGS = new Set(['css', 'scss', 'less']);

export function refreshDiagnostics(document: vscode.TextDocument): void {
    if (!CSS_LANGS.has(document.languageId)) return;

    const content = document.getText();
    const selectors = parseCssSelectors(content);

    // @ルール外 (ルートレベル) のセレクタのみ重複チェック対象とする
    // @media 内の上書き定義は重複とみなさない
    const rootSelectors = selectors.filter(s => !s.isAtRule);

    const firstOccurrence = new Map<string, CssSelectorInfo>();
    const diags: vscode.Diagnostic[] = [];

    for (const info of rootSelectors) {
        const key = info.selector;
        const first = firstOccurrence.get(key);
        if (first) {
            const range = new vscode.Range(
                new vscode.Position(info.line, info.character),
                new vscode.Position(info.line, info.character + key.length)
            );
            const diag = new vscode.Diagnostic(
                range,
                `"${key}" はすでに ${first.line + 1} 行目に定義されています。F12 (Go to Definition) で移動できます。`,
                vscode.DiagnosticSeverity.Warning
            );
            diag.source = 'CSSense';
            diags.push(diag);
        } else {
            firstOccurrence.set(key, info);
        }
    }

    diagnosticCollection.set(document.uri, diags);
}
