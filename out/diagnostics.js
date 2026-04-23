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
exports.diagnosticCollection = void 0;
exports.refreshDiagnostics = refreshDiagnostics;
const vscode = __importStar(require("vscode"));
const cssParser_1 = require("./cssParser");
exports.diagnosticCollection = vscode.languages.createDiagnosticCollection('cssense');
const CSS_LANGS = new Set(['css', 'scss', 'less']);
function isIgnored(lines, selectorLine) {
    if (selectorLine === 0)
        return false;
    return lines[selectorLine - 1].trim() === '/* cssense-ignore */';
}
function refreshDiagnostics(document) {
    if (!CSS_LANGS.has(document.languageId))
        return;
    const content = document.getText();
    const lines = content.split('\n');
    const selectors = (0, cssParser_1.parseCssSelectors)(content);
    // ルートレベル かつ 単体セレクタ のみ重複チェック対象
    const candidates = selectors.filter(s => !s.isAtRule && !s.isMulti);
    const firstOccurrence = new Map();
    const diags = [];
    for (const info of candidates) {
        if (isIgnored(lines, info.line)) {
            continue;
        }
        const key = info.selector;
        const first = firstOccurrence.get(key);
        if (first) {
            const range = new vscode.Range(new vscode.Position(info.line, info.character), new vscode.Position(info.line, info.character + key.length));
            const msg = '"' + key + '" はすでに ' + (first.line + 1) + ' 行目に定義されています。F12 (Go to Definition) で移動できます。';
            const diag = new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Warning);
            diag.source = 'CSSense';
            diags.push(diag);
        }
        else {
            firstOccurrence.set(key, info);
        }
    }
    exports.diagnosticCollection.set(document.uri, diags);
}
//# sourceMappingURL=diagnostics.js.map