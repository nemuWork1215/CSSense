import * as vscode from 'vscode';
import { getHtmlSelectorsForCss } from './htmlParser';
import { isAtSelectorPosition } from './cssParser';

export class CssCompletionProvider implements vscode.CompletionItemProvider {
    async provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken,
        _context: vscode.CompletionContext
    ): Promise<vscode.CompletionItem[] | undefined> {
        if (!isAtSelectorPosition(document, position)) return;

        const lineText = document.lineAt(position.line).text;
        const upToCursor = lineText.slice(0, position.character);

        // 最後のセレクタトークン (スペース・コンビネータより後)
        const token = upToCursor.match(/[^\s,>+~(]*$/)?.[0] ?? '';

        // 入力済みのトークンを丸ごと置き換える範囲
        const replaceRange = new vscode.Range(
            new vscode.Position(position.line, position.character - token.length),
            position
        );

        const { classes, ids, elements } = await getHtmlSelectorsForCss(document.uri);
        const items: vscode.CompletionItem[] = [];

        if (token.startsWith('.')) {
            // クラスセレクタ候補 — insertText は "." を含む
            const prefix = token.slice(1).toLowerCase();
            for (const cls of classes) {
                if (cls.toLowerCase().startsWith(prefix)) {
                    items.push(makeItem(`.${cls}`, `.${cls}`, replaceRange,
                        vscode.CompletionItemKind.Class, 'class (HTML)'));
                }
            }
        } else if (token.startsWith('#')) {
            // IDセレクタ候補 — insertText は "#" を含む
            const prefix = token.slice(1).toLowerCase();
            for (const id of ids) {
                if (id.toLowerCase().startsWith(prefix)) {
                    items.push(makeItem(`#${id}`, `#${id}`, replaceRange,
                        vscode.CompletionItemKind.Reference, 'id (HTML)'));
                }
            }
        } else {
            // 要素セレクタ候補
            const prefix = token.toLowerCase();
            for (const el of elements) {
                if (el.startsWith(prefix)) {
                    items.push(makeItem(el, el, replaceRange,
                        vscode.CompletionItemKind.Keyword, 'element (HTML)', '1'));
                }
            }
            // トークンが空のときはクラス・IDも列挙
            if (!token) {
                for (const cls of classes) {
                    items.push(makeItem(`.${cls}`, `.${cls}`, replaceRange,
                        vscode.CompletionItemKind.Class, 'class (HTML)', '2'));
                }
                for (const id of ids) {
                    items.push(makeItem(`#${id}`, `#${id}`, replaceRange,
                        vscode.CompletionItemKind.Reference, 'id (HTML)', '2'));
                }
            }
        }

        return items;
    }
}

function makeItem(
    label: string,
    selector: string,
    range: vscode.Range,
    kind: vscode.CompletionItemKind,
    detail: string,
    sortPrefix = '0'
): vscode.CompletionItem {
    const item = new vscode.CompletionItem(label, kind);
    // セレクタ確定後にすぐルールセットを書ける状態にする
    item.insertText = new vscode.SnippetString(`${selector} {\n\t$0\n}`);
    item.range = range;
    item.detail = detail;
    item.sortText = `${sortPrefix}_${label}`;
    return item;
}
