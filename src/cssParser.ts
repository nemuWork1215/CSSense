import * as vscode from 'vscode';

export interface CssSelectorInfo {
    /** セレクタ文字列 (例: ".header", "#main", "div") */
    selector: string;
    /** 0-indexed 行番号 */
    line: number;
    /** 0-indexed 列番号 */
    character: number;
    /** @media / @supports などの中にあるセレクタかどうか */
    isAtRule: boolean;
}

/**
 * CSSテキストからすべてのトップレベル / @ルール直下のセレクタを抽出する。
 * コメント・文字列リテラルは読み飛ばす。
 */
export function parseCssSelectors(content: string): CssSelectorInfo[] {
    const result: CssSelectorInfo[] = [];
    let depth = 0;
    let selectorStart = 0;
    let inComment = false;
    let inString = false;
    let stringChar = '';
    // depth d が @rule で開かれたかを追跡する
    const atRuleAtDepth = new Set<number>();

    for (let i = 0; i < content.length; i++) {
        const c = content[i];
        const next = content[i + 1] ?? '';

        if (inComment) {
            if (c === '*' && next === '/') { inComment = false; i++; }
            continue;
        }
        if (inString) {
            if (c === stringChar) inString = false;
            continue;
        }
        if (c === '/' && next === '*') { inComment = true; i++; continue; }
        if (c === '"' || c === "'") { inString = true; stringChar = c; continue; }

        if (c === '{') {
            // スライスからコメントを除去してセレクタ候補を得る
            const raw = content.slice(selectorStart, i)
                .replace(/\/\*[\s\S]*?\*\//g, '')
                .trim();

            if (raw.startsWith('@')) {
                // @media, @supports などの @ルール
                atRuleAtDepth.add(depth);
            } else if (raw && (depth === 0 || depth === 1)) {
                // depth 0 = トップレベル, depth 1 = @ルール直下
                const isAtRule = atRuleAtDepth.has(depth - 1);
                pushSelectors(result, content, raw, selectorStart, i, isAtRule);
            }

            depth++;
            selectorStart = i + 1;
        } else if (c === '}') {
            atRuleAtDepth.delete(depth - 1);
            depth = Math.max(0, depth - 1);
            selectorStart = i + 1;
        }
    }

    return result;
}

function pushSelectors(
    result: CssSelectorInfo[],
    content: string,
    rawNoComments: string,
    searchFrom: number,
    limit: number,
    isAtRule: boolean
): void {
    const parts = rawNoComments.split(',');
    let offset = searchFrom;

    for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed) {
            const idx = content.indexOf(trimmed, offset);
            if (idx !== -1 && idx < limit) {
                const before = content.slice(0, idx);
                const lines = before.split('\n');
                result.push({
                    selector: trimmed,
                    line: lines.length - 1,
                    character: lines[lines.length - 1].length,
                    isAtRule,
                });
                offset = idx + trimmed.length;
            }
        }
    }
}

/**
 * カーソル位置がセレクタを書くべき位置 (ルールブロックの外) かどうかを返す。
 */
export function isAtSelectorPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): boolean {
    const fullText = document.getText(new vscode.Range(
        new vscode.Position(0, 0),
        position
    ));

    let depth = 0;
    let inComment = false;
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < fullText.length; i++) {
        const c = fullText[i];
        const next = fullText[i + 1] ?? '';

        if (inComment) {
            if (c === '*' && next === '/') { inComment = false; i++; }
            continue;
        }
        if (inString) {
            if (c === stringChar) inString = false;
            continue;
        }
        if (c === '/' && next === '*') { inComment = true; i++; continue; }
        if (c === '"' || c === "'") { inString = true; stringChar = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth = Math.max(0, depth - 1);
    }

    // depth 0 = トップレベル, depth 1 = @media などの中 (どちらもセレクタ位置)
    return depth === 0 || depth === 1;
}

/**
 * カーソル位置にあるセレクタトークンを返す。
 * 例: ".foo-bar", "#main", "div"
 */
export function getSelectorTokenAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): string | null {
    const lineText = document.lineAt(position.line).text;
    const before = lineText.slice(0, position.character);
    const after = lineText.slice(position.character);

    const beforeMatch = before.match(/[.#]?[\w-]+$/);
    if (!beforeMatch) return null;

    const afterMatch = after.match(/^[\w-]*/);
    return beforeMatch[0] + (afterMatch?.[0] ?? '');
}
