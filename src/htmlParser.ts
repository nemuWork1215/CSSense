import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

export interface HtmlSelectors {
    classes: Set<string>;
    ids: Set<string>;
    elements: Set<string>;
}

export function extractFromHtml(content: string): HtmlSelectors {
    const classes = new Set<string>();
    const ids = new Set<string>();
    const elements = new Set<string>();

    const classRe = /\bclass\s*=\s*(?:"([^"]*?)"|'([^']*?)')/g;
    const idRe = /\bid\s*=\s*(?:"([^"]*?)"|'([^']*?)')/g;
    const elemRe = /<([a-zA-Z][a-zA-Z0-9-]*)/g;

    let m: RegExpExecArray | null;

    while ((m = classRe.exec(content)) !== null) {
        const val = m[1] ?? m[2];
        for (const c of val.split(/\s+/)) {
            if (c) classes.add(c);
        }
    }
    while ((m = idRe.exec(content)) !== null) {
        const id = (m[1] ?? m[2]).trim();
        if (id) ids.add(id);
    }
    while ((m = elemRe.exec(content)) !== null) {
        elements.add(m[1].toLowerCase());
    }

    return { classes, ids, elements };
}

interface CacheEntry {
    data: HtmlSelectors;
    time: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 4000;

export async function getHtmlSelectorsForCss(cssUri: vscode.Uri): Promise<HtmlSelectors> {
    const key = cssUri.fsPath;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
        return cached.data;
    }

    const config = vscode.workspace.getConfiguration('cssense');
    const maxFiles = config.get<number>('maxHtmlFiles', 300);

    const allHtmlFiles = await vscode.workspace.findFiles(
        '**/*.{html,htm}',
        '**/node_modules/**',
        maxFiles
    );

    const cssFileName = path.basename(cssUri.fsPath);
    // Escape special regex characters in the filename
    const escapedName = cssFileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const linkPattern = new RegExp(`href\\s*=\\s*(?:"[^"]*${escapedName}"|'[^']*${escapedName}')`);

    const linked: vscode.Uri[] = [];
    for (const uri of allHtmlFiles) {
        try {
            const content = fs.readFileSync(uri.fsPath, 'utf-8');
            if (linkPattern.test(content)) {
                linked.push(uri);
            }
        } catch { /* skip unreadable files */ }
    }

    const searchAllHtmlFiles = config.get<boolean>('searchAllHtmlFiles', false);
    const filesToProcess = linked.length > 0
        ? linked
        : searchAllHtmlFiles ? allHtmlFiles : linked;

    const result: HtmlSelectors = {
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
        } catch { /* skip */ }
    }

    cache.set(key, { data: result, time: Date.now() });
    return result;
}

export function invalidateCache(cssUri: vscode.Uri): void {
    cache.delete(cssUri.fsPath);
}
