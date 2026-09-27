import * as vscode from 'vscode';

export function openSwaggerPreview(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('aura');
    const port = config.get<number>('swagger.port') || 8080;
    const swaggerUrl = `http://127.0.0.1:${port}/swagger`;

    const panel = vscode.window.createWebviewPanel(
        'auraSwaggerPreview',
        'Aura OpenAPI / Swagger Preview',
        vscode.ViewColumn.Beside,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    panel.webview.html = getSwaggerHtml(swaggerUrl);
}

function getSwaggerHtml(url: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Aura OpenAPI / Swagger UI</title>
    <style>
        body, html {
            margin: 0; padding: 0; height: 100%; width: 100%;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-font-family);
            display: flex; flex-direction: column;
        }
        .header {
            padding: 8px 16px;
            background: var(--vscode-editorWidget-background);
            border-bottom: 1px solid var(--vscode-editorWidget-border);
            display: flex; align-items: center; justify-content: space-between;
        }
        .url-box {
            font-size: 13px; font-family: monospace;
            color: var(--vscode-textLink-foreground);
        }
        iframe {
            flex: 1; border: none; width: 100%; height: 100%;
            background: #fff;
        }
    </style>
</head>
<body>
    <div class="header">
        <div><strong>Aura Microservice OpenAPI Preview</strong></div>
        <div class="url-box">${url}</div>
    </div>
    <iframe src="${url}"></iframe>
</body>
</html>`;
}
