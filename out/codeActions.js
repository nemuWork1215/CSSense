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
exports.CssSuppressActionProvider = void 0;
const vscode = __importStar(require("vscode"));
class CssSuppressActionProvider {
    provideCodeActions(document, _range, context) {
        return context.diagnostics
            .filter(d => d.source === 'CSSense')
            .map(d => this.createIgnoreAction(document, d));
    }
    createIgnoreAction(document, diagnostic) {
        const action = new vscode.CodeAction('この重複を許容する (cssense-ignore を追加)', vscode.CodeActionKind.QuickFix);
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        const line = diagnostic.range.start.line;
        // 対象行のインデントに合わせてコメントを挿入
        const indent = document.lineAt(line).text.match(/^\s*/)?.[0] ?? '';
        action.edit.insert(document.uri, new vscode.Position(line, 0), `${indent}/* cssense-ignore */\n`);
        return action;
    }
}
exports.CssSuppressActionProvider = CssSuppressActionProvider;
CssSuppressActionProvider.providedCodeActionKinds = [vscode.CodeActionKind.QuickFix];
//# sourceMappingURL=codeActions.js.map