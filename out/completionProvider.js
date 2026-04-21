"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CssCompletionProvider = void 0;
const vscode = __importStar(require("vscode"));
const htmlParser_1 = require("./htmlParser");
const cssParser_1 = require("./cssParser");
class CssCompletionProvider {
    async provideCompletionItems(document, position, _token, _context) {
        if (!(0, cssParser_1.isAtSelectorPosition)(document, position))
            return;
        const lineText = document.lineAt(position.line).text;
        const upToCursor = lineText.slice(0, position.character);
        // 最後のセレクタトークン (スペース・コンビネータより後)
        const token = upToCursor.match(/[^\s,>+~(]*$/)?.[0] ?? '';
        // 入力済みのトークンを丸ごと置き換える範囲
        const replaceRange = new vscode.Range(new vscode.Position(position.line, position.character - token.length), position);
        const { classes, ids, elements } = await (0, htmlParser_1.getHtmlSelectorsForCss)(document.uri);
        const items = [];
        if (token.startsWith('.')) {
            // クラスセレクタ候補 — insertText は "." を含む
            const prefix = token.slice(1).toLowerCase();
            for (const cls of classes) {
                if (cls.toLowerCase().startsWith(prefix)) {
                    items.push(makeItem(`.${cls}`, `.${cls}`, replaceRange, vscode.CompletionItemKind.Class, 'class (HTML)'));
                }
            }
        }
        else if (token.startsWith('#')) {
            // IDセレクタ候補 — insertText は "#" を含む
            const prefix = token.slice(1).toLowerCase();
            for (const id of ids) {
                if (id.toLowerCase().startsWith(prefix)) {
                    items.push(makeItem(`#${id}`, `#${id}`, replaceRange, vscode.CompletionItemKind.Reference, 'id (HTML)'));
                }
            }
        }
        else {
            // 要素セレクタ候補
            const prefix = token.toLowerCase();
            for (const el of elements) {
                if (el.startsWith(prefix)) {
                    items.push(makeItem(el, el, replaceRange, vscode.CompletionItemKind.Keyword, 'element (HTML)', '1'));
                }
            }
            // トークンが空のときはクラス・IDも列挙
            if (!token) {
                for (const cls of classes) {
                    items.push(makeItem(`.${cls}`, `.${cls}`, replaceRange, vscode.CompletionItemKind.Class, 'class (HTML)', '2'));
                }
                for (const id of ids) {
                    items.push(makeItem(`#${id}`, `#${id}`, replaceRange, vscode.CompletionItemKind.Reference, 'id (HTML)', '2'));
                }
            }
        }
        return items;
    }
}
exports.CssCompletionProvider = CssCompletionProvider;
function makeItem(label, selector, range, kind, detail, sortPrefix = '0') {
    const item = new vscode.CompletionItem(label, kind);
    // セレクタ確定後にすぐルールセットを書ける状態にする
    item.insertText = new vscode.SnippetString(`${selector} {\n\t$0\n}`);
    item.range = range;
    item.detail = detail;
    item.sortText = `${sortPrefix}_${label}`;
    return item;
}
//# sourceMappingURL=completionProvider.js.map