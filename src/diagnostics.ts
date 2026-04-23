import * as vscode from 'vscode';
import { parseCssSelectors, CssSelectorInfo } from './cssParser';

export const diagnosticCollection = vscode.languages.createDiagnosticCollection('cssense');

const CSS_LANGS = new Set(['css', 'scss', 'less']);

function isIgnored(lines: string[], selectorLine: number): boolean {
    if (selectorLine === 0) return false;
    return lines[selectorLine - 1].trim() === '/* cssense-ignore */';
}

export function refreshDiagnostics(document: vscode.TextDocument): void {
    if (!CSS_LANGS.has(document.languageId)) return;

    const content = document.getText();
    const lines = content.split('\n');
    const selectors = parseCssSelectors(content);

    // ルートレベル かつ 単体セレクタ のみ重複チェック対象
    const candidates = selectors.filter(s => !s.isAtRule && !s.isMulti);

    const firstOccurrence = new Map<string, CssSelectorInfo>();
    const diags: vscode.Diagnostic[] = [];

    for (const info of candidates) {
        if (isIgnored(lines, info.line)) { continue; }

        const key = info.selector;
        const first = firstOccurrence.get(key);
        if (first) {
            const range = new vscode.Range(
                new vscode.Position(info.line, info.character),
                new vscode.Position(info.line, info.character + key.length)
            );
            const msg = '"' + key + '" はすでに ' + (first.line + 1) + ' 行目に定義されています。F12 (Go to Definition) で移動できます。';
            const diag = new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Warning);
            diag.source = 'CSSense';
            diags.push(diag);
        } else {
            firstOccurrence.set(key, info);
        }
    }

    diagnosticCollection.set(document.uri, diags);
}
