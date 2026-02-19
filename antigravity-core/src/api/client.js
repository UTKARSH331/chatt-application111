const AntigravityNode = require('../network/connection_manager');
const EventEmitter = require('events');

/**
 * AntigravityClient
 * 
 * Public API facade for UI consumption.
 * Abstracts away the complexity of keeping the node running and managing connections.
 */
class AntigravityClient extends EventEmitter {
    constructor(port = 3000) {
        super();
        this.node = new AntigravityNode(port);
        this._setupListeners();
    }

    _setupListeners() {
        this.node.on('message', (msg) => {
            this.emit('message', {
                senderId: msg.fromId,
                content: msg.content,
                timestamp: msg.timestamp
            });
        });

        this.node.on('peer:connected', ({ id }) => {
            this.emit('peer:connected', id);
        });

        // Forward other events as needed
    }

    /**
     * Start the P2P node
     */
    start() {
        this.node.start();
    }

    /**
     * Connect to a specific peer (e.g., via manual IP entry)
     * @param {string} ip 
     * @param {number} port 
     */
    connectToPeer(ip, port) {
        this.node.connect(ip, port);
    }

    /**
     * Send a text message to a peer
     * @param {string} peerId 
     * @param {string} content 
     */
    sendMessage(peerId, content) {
        this.node.sendMessage(peerId, content);
    }

    /**
     * Broadcast a message to all connected peers
     * @param {string} content 
     */
    broadcast(content) {
        for (const [peerId, socket] of this.node.peers) {
            this.node.sendMessage(peerId, content);
        }
    }

    /**
     * Get local Node ID
     */
    getMyId() {
        return this.node.id;
    }
}

module.exports = AntigravityClient;
