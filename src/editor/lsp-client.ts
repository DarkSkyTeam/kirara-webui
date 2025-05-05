import * as vscode from 'vscode';
import { WebSocketMessageReader } from 'vscode-ws-jsonrpc';
import { CloseAction, ErrorAction, MessageTransports } from 'vscode-languageclient/browser.js';
import { WebSocketMessageWriter } from 'vscode-ws-jsonrpc';
import { toSocket } from 'vscode-ws-jsonrpc';
import { MonacoLanguageClient } from 'monaco-languageclient';

export const initWebSocketAndStartClient = (webSocket: WebSocket): Promise<MonacoLanguageClient> => {
    return new Promise((resolve) => {
        webSocket.onopen = () => {
            const socket = toSocket(webSocket);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);
            const languageClient = createLanguageClient({
                reader,
                writer
            });
            languageClient.start();
            languageClient.sendNotification('workspace/didChangeConfiguration', {
                settings: {
                    'pylsp.plugins.rope_autoimport.enabled': true,
                    'pylsp.plugins.rope_completion.enabled': true,
                }
            });
            reader.onClose(() => languageClient.stop());
            resolve(languageClient);
        };
    });
};

const createLanguageClient = (messageTransports: MessageTransports): MonacoLanguageClient => {
    return new MonacoLanguageClient({
        name: 'Kirara Python Language Client',
        clientOptions: {
            // use a language id as a document selector
            documentSelector: ['python'],
            // disable the default error handler
            errorHandler: {
                error: () => ({ action: ErrorAction.Continue }),
                closed: () => ({ action: CloseAction.DoNotRestart })
            },
            workspaceFolder: {
                uri: vscode.Uri.parse('/kirara-ai/workflows'),
                name: 'Kirara AI',
                index: 0
            }
        },
        messageTransports: messageTransports,
    });
};