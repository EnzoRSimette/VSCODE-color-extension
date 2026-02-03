const vscode = require('vscode');

// Mapeamento das letras para cores e opções de estilo
const tagConfig = {
    'g': { color: '#4caf50', label: 'Verde' },       // Green
    'o': { color: '#ff9800', label: 'Laranja' },     // Orange
    'r': { color: '#f44336', label: 'Vermelho' },    // Red
    '!': { color: '#ff2c2c', label: 'Alerta', fontWeight: 'bold' }, // Red (Alert)
    'b': { color: '#2196f3', label: 'Azul' },        // Blue
    '?': { color: '#3498db', label: 'Dúvida' },      // Blue (Query)
    'p': { color: '#9c27b0', label: 'Roxo' },        // Purple
    'y': { color: '#ffeb3b', label: 'Amarelo' },     // Yellow
    'wb': { color: new vscode.ThemeColor('editor.foreground'), label: 'Padrão' } // White/Black (Theme)
};

// Cache para decorações de cores customizadas (rgb/hex) para não criar infinitos objetos
let customDecorationTypes = new Map();
// Cache para decorações padrão
let staticDecorationTypes = new Map();

function activate(context) {
    console.log('Extensão "Comentários Coloridos" ativa!');

    // Criar decorações estáticas (g, r, b, etc.)
    Object.keys(tagConfig).forEach(tag => {
        const config = tagConfig[tag];
        const decoration = vscode.window.createTextEditorDecorationType({
            color: config.color,
            fontWeight: config.fontWeight || 'bold',
            rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen
        });
        staticDecorationTypes.set(tag, decoration);
    });

    let activeEditor = vscode.window.activeTextEditor;

    function updateDecorations() {
        if (!activeEditor) return;

        const text = activeEditor.document.getText();
        
        // Arrays para armazenar os ranges (posições) de cada tipo de tag encontrada
        const decoratorsMap = new Map(); // Mapa para tags estáticas
        const customDecoratorsMap = new Map(); // Mapa para tags customizadas (hex/rgb)

        // Inicializa arrays vazios para tags estáticas
        staticDecorationTypes.forEach((_, key) => decoratorsMap.set(key, []));

        // REGEX EXPLICADO:
        // 1. (Start): Captura inícios de comentários: //, ///, #, /*, <!--
        // 2. \s*: Espaços opcionais
        // 3. (Tag): Captura as tags (g, o, r...) OU customizadas (rgb(...), #...)
        // 4. (Separator)?: Captura opcional de :
        const regEx = /(\/\/|\/\/\/|\#|\/\*|<!--)\s*([gorpby]|wb|!|\?|\((#[0-9a-fA-F]{3,6}|rgb\([^)]+\))\))(:)?/g;

        let match;
        while ((match = regEx.exec(text))) {
            const startPos = activeEditor.document.positionAt(match.index);
            const endPos = activeEditor.document.lineAt(startPos.line).range.end;
            
            // Ajuste para comentários de bloco (/* ... */ ou <!-- ... -->)
            // Se for bloco, tentamos encontrar o fechamento na mesma linha ou assumimos até o fim da linha
            let decorationRange = new vscode.Range(startPos, endPos);
            
            // O grupo 2 é a tag (ex: 'g', '!', '(rgb(0,0,0))')
            let tag = match[2]; 

            // Verificar se é customizado (começa com parenteses)
            if (tag.startsWith('(') && tag.endsWith(')')) {
                const colorValue = tag.substring(1, tag.length - 1); // Remove parenteses
                
                if (!customDecoratorsMap.has(colorValue)) {
                    customDecoratorsMap.set(colorValue, []);
                }
                customDecoratorsMap.get(colorValue).push({ range: decorationRange });
            } 
            // Tags estáticas
            else if (decoratorsMap.has(tag)) {
                decoratorsMap.get(tag).push({ range: decorationRange });
            }
        }

        // 1. Aplicar Decorações Estáticas
        staticDecorationTypes.forEach((decorationType, tag) => {
            const ranges = decoratorsMap.get(tag);
            activeEditor.setDecorations(decorationType, ranges);
        });

        // 2. Aplicar Decorações Customizadas (Hex/RGB)
        customDecoratorsMap.forEach((ranges, colorValue) => {
            let decorationType;
            
            // Tenta recuperar do cache global ou cria novo
            if (customDecorationTypes.has(colorValue)) {
                decorationType = customDecorationTypes.get(colorValue);
            } else {
                decorationType = vscode.window.createTextEditorDecorationType({
                    color: colorValue,
                    fontWeight: 'bold'
                });
                customDecorationTypes.set(colorValue, decorationType);
            }
            
            activeEditor.setDecorations(decorationType, ranges);
        });
    }

    if (activeEditor) {
        triggerUpdateDecorations();
    }

    // Eventos para disparar a atualização
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

    var timeout = null;
    function triggerUpdateDecorations() {
        if (timeout) {
            clearTimeout(timeout);
        }
        // Pequeno delay para performance (não rodar a cada tecla digitada instantaneamente)
        timeout = setTimeout(updateDecorations, 100);
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
}