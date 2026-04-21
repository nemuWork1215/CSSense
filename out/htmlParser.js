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
exports.extractFromHtml = extractFromHtml;
exports.getHtmlSelectorsForCss = getHtmlSelectorsForCss;
exports.invalidateCache = invalidateCache;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode = __importStar(require("vscode"));
function extractFromHtml(content) {
    const classes = new Set();
    const ids = new Set();
    const elements = new Set();
    const classRe = /\bclass\s*=\s*(?:"([^"]*?)"|'([^']*?)')/g;
    const idRe = /\bid\s*=\s*(?:"([^"]*?)"|'([^']*?)')/g;
    const elemRe = /<([a-zA-Z][a-zA-Z0-9-]*)/g;
    let m;
    while ((m = classRe.exec(content)) !== null) {
        const val = m[1] ?? m[2];
        for (const c of val.split(/\s+/)) {
            if (c)
                classes.add(c);
        }
    }
    while ((m = idRe.exec(content)) !== null) {
        const id = (m[1] ?? m[2]).trim();
        if (id)
            ids.add(id);
    }
    while ((m = elemRe.exec(content)) !== null) {
        elements.add(m[1].toLowerCase());
    }
    return { classes, ids, elements };
}
const cache = new Map();
const CACHE_TTL_MS = 4000;
async function getHtmlSelectorsForCss(cssUri) {
    const key = cssUri.fsPath;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
        return cached.data;
    }
    const config = vscode.workspace.getConfiguration('cssense');
    const maxFiles = config.get('maxHtmlFiles', 300);
    const allHtmlFiles = await vscode.workspace.findFiles('**/*.{html,htm}', '**/node_modules/**', maxFiles);
    const cssFileName = path.basename(cssUri.fsPath);
    // Escape special regex characters in the filename
    const escapedName = cssFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkPattern = new RegExp(`href\\s*=\\s*(?:"[^"]*${escapedName}"|'[^']*${escapedName}')`);
    const linked = [];
    for (const uri of allHtmlFiles) {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            if (linkPattern.test(content)) {
                linked.push(uri);
            }
        }
        catch { /* skip unreadable files */ }
    }
    const searchAllHtmlFiles = config.get('searchAllHtmlFiles', false);
    const filesToProcess = linked.length > 0
        ? linked
        : searchAllHtmlFiles ? allHtmlFiles : linked;
    const result = {
        classes: new Set(),
        ids: new Set(),
        elements: new Set(),
    };
    for (const uri of filesToProcess) {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            const { classes, ids, elements } = extractFromHtml(content);
            classes.forEach(c => result.classes.add(c));
            ids.forEach(id => result.ids.add(id));
            elements.forEach(el => result.elements.add(el));
        }
        catch { /* skip */ }
    }
    cache.set(key, { data: result, time: Date.now() });
    return result;
}
function invalidateCache(cssUri) {
    cache.delete(cssUri.fsPath);
}
//# sourceMappingURL=htmlParser.js.map