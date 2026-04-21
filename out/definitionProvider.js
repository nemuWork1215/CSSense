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
exports.CssDefinitionProvider = void 0;
const vscode = __importStar(require("vscode"));
const cssParser_1 = require("./cssParser");
class CssDefinitionProvider {
    provideDefinition(document, position, _token) {
        if (!(0, cssParser_1.isAtSelectorPosition)(document, position))
            return;
        const tokenAtCursor = (0, cssParser_1.getSelectorTokenAtPosition)(document, position);
        if (!tokenAtCursor)
            return;
        const content = document.getText();
        const allSelectors = (0, cssParser_1.parseCssSelectors)(content);
        const currentLine = position.line;
        const matches = allSelectors.filter(s => s.selector === tokenAtCursor ||
            s.selector === `.${tokenAtCursor}` ||
            s.selector === `#${tokenAtCursor}`);
        if (matches.length === 0)
            return;
        // カーソルより前にある定義を優先して返す (なければカーソル以外の全定義)
        const before = matches.filter(s => s.line < currentLine);
        const targets = before.length > 0 ? before : matches.filter(s => s.line !== currentLine);
        if (targets.length === 0)
            return;
        return targets.map(s => new vscode.Location(document.uri, new vscode.Position(s.line, s.character)));
    }
}
exports.CssDefinitionProvider = CssDefinitionProvider;
//# sourceMappingURL=definitionProvider.js.map