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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const completionProvider_1 = require("./completionProvider");
const definitionProvider_1 = require("./definitionProvider");
const codeActions_1 = require("./codeActions");
const diagnostics_1 = require("./diagnostics");
const htmlParser_1 = require("./htmlParser");
const CSS_SELECTOR = [
    { language: 'css' },
    { language: 'scss' },
    { language: 'less' },
];
function activate(context) {
    // セレクタ補完 (. と # をトリガー文字に追加)
    const completion = vscode.languages.registerCompletionItemProvider(CSS_SELECTOR, new completionProvider_1.CssCompletionProvider(), '.', '#');
    // 定義へ移動 (F12 / Ctrl+Click)
    const definition = vscode.languages.registerDefinitionProvider(CSS_SELECTOR, new definitionProvider_1.CssDefinitionProvider());
    // 重複セレクタのクイックアクション
    const codeAction = vscode.languages.registerCodeActionsProvider(CSS_SELECTOR, new codeActions_1.CssSuppressActionProvider(), { providedCodeActionKinds: codeActions_1.CssSuppressActionProvider.providedCodeActionKinds });
    // HTMLファイルが変更されたらキャッシュを無効化
    const onHtmlChange = vscode.workspace.onDidChangeTextDocument(e => {
        const lang = e.document.languageId;
        if (lang === 'html') {
            // CSSファイルのキャッシュをすべて破棄 (どのCSSがリンクされているか不明なため)
            vscode.workspace.textDocuments
                .filter(d => ['css', 'scss', 'less'].includes(d.languageId))
                .forEach(d => (0, htmlParser_1.invalidateCache)(d.uri));
        }
        if (['css', 'scss', 'less'].includes(lang)) {
            (0, diagnostics_1.refreshDiagnostics)(e.document);
        }
    });
    const onOpen = vscode.workspace.onDidOpenTextDocument(diagnostics_1.refreshDiagnostics);
    const onClose = vscode.workspace.onDidCloseTextDocument(d => diagnostics_1.diagnosticCollection.delete(d.uri));
    // 起動時にすでに開いているCSSファイルを処理
    vscode.workspace.textDocuments.forEach(diagnostics_1.refreshDiagnostics);
    context.subscriptions.push(completion, definition, codeAction, diagnostics_1.diagnosticCollection, onHtmlChange, onOpen, onClose);
}
function deactivate() { }
//# sourceMappingURL=extension.js.map