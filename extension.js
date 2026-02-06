const vscode = require('vscode');

// Caches for decorations
let customDecorationTypes = new Map();
let staticDecorationTypes = new Map();

function activate(context) {
    console.log('Extension "Color Comments" is active!');

    let activeEditor = vscode.window.activeTextEditor;
    let configTags = [];
    let globalConfig = {};

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function reloadConfiguration() {
        // Clear existing static decorations
        staticDecorationTypes.forEach(dec => dec.dispose());
        staticDecorationTypes.clear();

        const config = vscode.workspace.getConfiguration('colorComments');
        globalConfig = {
            fontWeight: config.get('fontWeight') || 'normal',
            fontStyle: config.get('fontStyle') || 'normal'
        };

        configTags = config.get('tags') || [];

        // Build decoration types for each tag in JSON
        configTags.forEach(tagItem => {

            // LOGIC FOR DYNAMIC THEME COLOR
            // If the user set "editor.foreground" in JSON, we convert it to a ThemeColor object
            let finalColor = tagItem.color;
            if (finalColor === 'editor.foreground') {
                finalColor = new vscode.ThemeColor('editor.foreground');
            }

            const options = {
                color: finalColor,
                backgroundColor: tagItem.backgroundColor || 'transparent',
                fontWeight: tagItem.bold ? 'bold' : globalConfig.fontWeight,
                fontStyle: tagItem.italic ? 'italic' : globalConfig.fontStyle,
                textDecoration: []
            };

            if (tagItem.strikethrough) options.textDecoration.push('line-through');
            if (tagItem.underline) options.textDecoration.push('underline');

            const decorationString = options.textDecoration.join(' ') || undefined;

            // Decoration Normal
            const decorationNormal = vscode.window.createTextEditorDecorationType({
                color: options.color,
                backgroundColor: options.backgroundColor,
                fontWeight: options.fontWeight,
                fontStyle: options.fontStyle,
                textDecoration: decorationString,
                rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen
            });
            staticDecorationTypes.set(tagItem.tag, decorationNormal);

            // Decoration Italic (suffix 'i')
            const decorationItalic = vscode.window.createTextEditorDecorationType({
                ...options,
                fontStyle: 'italic',
                textDecoration: decorationString,
                rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen
            });
            staticDecorationTypes.set(tagItem.tag + 'i', decorationItalic);
        });

        triggerUpdateDecorations();
    }

    function updateDecorations() {
        if (!activeEditor) return;
        const text = activeEditor.document.getText();

        const decoratorsMap = new Map();
        const customDecoratorsMap = new Map();

        staticDecorationTypes.forEach((_, key) => decoratorsMap.set(key, []));

        // --- REGEX CONSTRUCTION ---
        const tagNames = configTags.map(t => t.tag).filter(t => t);

        // Sort longest first to avoid partial matches
        tagNames.sort((a, b) => b.length - a.length);

        const escapedTags = tagNames.map(escapeRegExp).join('|');

        // Regex pattern:
        // Group 1: Comment Start
        // Group 2: The Tag (from JSON OR Custom Hex)
        // Group 3: Optional 'i' (Italic)
        // Group 4: Optional colon
        const tagPattern = escapedTags.length > 0
            ? `(?:${escapedTags})|\\((?:#[0-9a-fA-F]{3,6}|rgb\\([^)]+\\))\\)`
            : `\\((?:#[0-9a-fA-F]{3,6}|rgb\\([^)]+\\))\\)`;

        const regEx = new RegExp(`(\\/\\/|\\/\\/\\/|\\#|\\/\\*|<!--)(${tagPattern})(i)?(:)?`, 'g');

        let match;
        while ((match = regEx.exec(text))) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.lineAt(startPos.line).range.end;
            let decorationRange = new vscode.Range(startPos, endPos);

            const tag = match[2];
            const isItalic = match[3] === 'i';

            // --- Custom Color Logic: (hex) ---
            if (tag.startsWith('(')) {
                const colorValue = tag.substring(1, tag.length - 1);
                const cacheKey = colorValue + (isItalic ? 'i' : '');

                if (!customDecoratorsMap.has(cacheKey)) {
                    customDecoratorsMap.set(cacheKey, {
                        ranges: [],
                        color: colorValue,
                        isItalic: isItalic
                    });
                }
                customDecoratorsMap.get(cacheKey).ranges.push(decorationRange);
            }
            // --- Static Tag Logic ---
            else {
                const mapKey = tag + (isItalic ? 'i' : '');

                if (decoratorsMap.has(mapKey)) {
                    decoratorsMap.get(mapKey).push({ range: decorationRange });
                }
            }
        }

        // Apply Static Decorations
        staticDecorationTypes.forEach((decorationType, key) => {
            const ranges = decoratorsMap.get(key);
            activeEditor.setDecorations(decorationType, ranges);
        });

        // Apply Custom Decorations
        customDecoratorsMap.forEach((data, cacheKey) => {
            let decorationType;
            if (customDecorationTypes.has(cacheKey)) {
                decorationType = customDecorationTypes.get(cacheKey);
            } else {
                decorationType = vscode.window.createTextEditorDecorationType({
                    color: data.color,
                    fontWeight: globalConfig.fontWeight,
                    fontStyle: data.isItalic ? 'italic' : globalConfig.fontStyle
                });
                customDecorationTypes.set(cacheKey, decorationType);
            }
            activeEditor.setDecorations(decorationType, data.ranges);
        });
    }

    // Initial Load
    reloadConfiguration();

    if (activeEditor) {
        triggerUpdateDecorations();
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        activeEditor = editor;
        if (editor) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument(event => {
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations();
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('colorComments')) {
            reloadConfiguration();
        }
    }, null, context.subscriptions);

    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(updateDecorations, 100);
    }
}

function deactivate() {
    staticDecorationTypes.forEach(d => d.dispose());
    customDecorationTypes.forEach(d => d.dispose());
}

module.exports = {
    activate,
    deactivate
}