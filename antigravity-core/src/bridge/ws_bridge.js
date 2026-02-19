const { WebSocketServer } = require('ws');
const AntigravityNode = require('../network/connection_manager');

/**
 * WebSocketBridge
 * 
 * Bridges the AntigravityNode P2P core with browser-based clients via WebSocket.
 * The React frontend connects to this bridge to interact with the P2P network.
 */
class WebSocketBridge {
    constructor(wsPort = 9000, p2pPort = 5000) {
        this.wsPort = wsPort;
        this.node = new AntigravityNode(p2pPort);
        this.clients = new Map(); // Map<WebSocket, userId>
        this.wss = null;
    }

    start() {
        // Start P2P node
        this.node.start();

        // Start WebSocket server for browser clients
        this.wss = new WebSocketServer({ port: this.wsPort });
        console.log(`[Bridge] WebSocket server listening on ws://localhost:${this.wsPort}`);

        this.wss.on('connection', (ws) => {
            console.log('[Bridge] Browser client connected');

            ws.on('message', (raw) => {
                try {
                    const data = JSON.parse(raw.toString());
                    this._handleClientMessage(ws, data);
                } catch (err) {
                    console.error('[Bridge] Invalid message from client:', err.message);
                }
            });

            ws.on('close', () => {
                this.clients.delete(ws);
                console.log('[Bridge] Browser client disconnected');
            });

            // Send node info to the client
            ws.send(JSON.stringify({
                type: 'NODE_INFO',
                nodeId: this.node.id,
                port: this.node.port
            }));
        });

        // Forward P2P events to WebSocket clients
        this.node.on('peer:connected', ({ id }) => {
            this._broadcast({
                type: 'PEER_CONNECTED',
                peerId: id
            });
        });

        this.node.on('message', (msg) => {
            this._broadcast({
                type: 'MESSAGE_RECEIVED',
                fromId: msg.fromId,
                content: msg.content,
                timestamp: msg.timestamp
            });
        });

        this.node.on('stream', ({ data, from }) => {
            this._broadcast({
                type: 'STREAM_DATA',
                from: `${from.address}:${from.port}`,
                data: data.toString('base64')
            });
        });
    }

    _handleClientMessage(ws, data) {
        switch (data.type) {
            case 'CONNECT_PEER':
                this.node.connect(data.ip, data.port);
                break;

            case 'SEND_MESSAGE':
                this.node.sendMessage(data.peerId, data.content);
                break;

            case 'JOIN_NETWORK':
                this.node.join(data.ip, data.port);
                break;

            default:
                console.warn('[Bridge] Unknown client command:', data.type);
        }
    }

    _broadcast(data) {
        const payload = JSON.stringify(data);
        if (this.wss) {
            this.wss.clients.forEach(client => {
                if (client.readyState === 1) { // WebSocket.OPEN
                    client.send(payload);
                }
            });
        }
    }
}

module.exports = WebSocketBridge;

// Auto-start if run directly
if (require.main === module) {
    const bridge = new WebSocketBridge();
    bridge.start();
}
