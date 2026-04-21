import * as vscode from 'vscode';
import { parseCssSelectors, isAtSelectorPosition, getSelectorTokenAtPosition } from './cssParser';

export class CssDefinitionProvider implements vscode.DefinitionProvider {
    provideDefinition(
        document: vscode.TextDocument,
        position: vscode.Position,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Definition> {
        if (!isAtSelectorPosition(document, position)) return;

        const tokenAtCursor = getSelectorTokenAtPosition(document, position);
        if (!tokenAtCursor) return;

        const content = document.getText();
        const allSelectors = parseCssSelectors(content);
        const currentLine = position.line;

        const matches = allSelectors.filter(s =>
            s.selector === tokenAtCursor ||
            s.selector === `.${tokenAtCursor}` ||
            s.selector === `#${tokenAtCursor}`
        );

        if (matches.length === 0) return;

        // カーソルより前にある定義を優先して返す (なければカーソル以外の全定義)
        const before = matches.filter(s => s.line < currentLine);
        const targets = before.length > 0 ? before : matches.filter(s => s.line !== currentLine);

        if (targets.length === 0) return;

        return targets.map(s =>
            new vscode.Location(
                document.uri,
                new vscode.Position(s.line, s.character)
            )
        );
    }
}
