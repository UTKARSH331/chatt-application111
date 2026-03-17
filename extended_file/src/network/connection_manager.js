const net = require('net');
const dgram = require('dgram');
const EventEmitter = require('events');
const crypto = require('crypto');
const KademliaDHT = require('../dht/kademlia');
const AntigravityEncryption = require('../crypto/encryption');

/**
 * AntigravityNode
 * 
 * Core networking class for the P2P messaging application.
 * Handles hybrid TCP/UDP connections, peer discovery, and message routing.
 */
class AntigravityNode extends EventEmitter {
    constructor(port) {
        super();
        this.port = port;
        this.peers = new Map(); // Map<PeerID, Socket>
        this.knownPeers = new Map(); // Map<PeerID, {ip, port}> - For DHT/Discovery

        // Identity Generation
        // In a real app, keys should be persisted to disk.
        this.keyPair = crypto.generateKeyPairSync('ed25519', {
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
        });

        // ID is a SHA-256 hash of the public key
        this.id = crypto.createHash('sha256').update(this.keyPair.publicKey).digest('hex');

        // Initialize DHT
        this.dht = new KademliaDHT(this.id);

        // Initialize Encryption
        this.encryption = new AntigravityEncryption();

        console.log(`[Antigravity] Node Initialized. ID: ${this.id.substr(0, 8)}...`);

        // TCP Server for reliable messaging (Signal, Text)
        this.tcpServer = net.createServer((socket) => this._handleTCPConnection(socket));

        // UDP Socket for real-time media (Voice, Video)
        this.udpSocket = dgram.createSocket('udp4');
    }

    /**
     * Start the node servers
     */
    start() {
        // Start TCP Server
        this.tcpServer.listen(this.port, () => {
            console.log(`[Antigravity] TCP Server listening on port ${this.port}`);
        });

        this.tcpServer.on('error', (err) => {
            console.error('[Antigravity] TCP Server Error:', err);
        });

        // Start UDP Socket
        this.udpSocket.bind(this.port, () => {
            console.log(`[Antigravity] UDP Stream ready on port ${this.port}`);
        });

        this.udpSocket.on('message', (msg, rinfo) => this._handleUDPMessage(msg, rinfo));
        this.udpSocket.on('error', (err) => {
            console.error('[Antigravity] UDP Socket Error:', err);
            this.udpSocket.close();
        });
    }

    /**
     * Connect to a peer via TCP
     * @param {string} ip 
     * @param {number} port 
     */
    connect(ip, port) {
        console.log(`[Antigravity] Attempting to connect to ${ip}:${port}...`);
        const socket = new net.Socket();

        socket.connect(port, ip, () => {
            console.log(`[Antigravity] Connected to peer at ${ip}:${port}`);
            // Initiate Handshake: Send Public Key & Encryption Key
            const handshake = {
                type: 'HANDSHAKE',
                id: this.id,
                pubKey: this.keyPair.publicKey, // Node Identity Key
                ecdhKey: this.encryption.getPublicKey() // Session Key
            };
            this._sendReliable(socket, handshake);
        });

        socket.on('error', (err) => {
            console.error(`[Antigravity] Connection failed to ${ip}:${port}:`, err.message);
        });

        this._setupSocketEvents(socket);
    }

    /**
     * Handle incoming TCP connection
     * @param {net.Socket} socket 
     */
    _handleTCPConnection(socket) {
        const remoteAddress = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`[Antigravity] Incoming TCP connection from ${remoteAddress}`);
        this._setupSocketEvents(socket);
    }

    /**
     * Setup event listeners for a TCP socket
     * @param {net.Socket} socket 
     */
    _setupSocketEvents(socket) {
        let buffer = '';

        socket.on('data', (data) => {
            buffer += data.toString();

            // Basic delimiter handling (newline for simplicity in this boilerplate)
            // In production, use length-prefixed protocol
            const messages = buffer.split('\n');
            buffer = messages.pop(); // Keep incomplete chunk

            messages.forEach(msgString => {
                if (!msgString.trim()) return;
                try {
                    const message = JSON.parse(msgString);
                    this._processMessage(socket, message);
                } catch (err) {
                    console.error('[Antigravity] Failed to parse message', err);
                }
            });
        });

        socket.on('close', () => {
            console.log('[Antigravity] Socket closed');
            // Cleanup peer from maps if needed
        });

        socket.on('error', (err) => {
            console.error(`[Antigravity] Socket error: ${err.message}`);
        });
    }

    /**
     * Process parsed message
     * @param {net.Socket} socket 
     * @param {Object} message 
     */
    _processMessage(socket, message) {
        if (message.type === 'HANDSHAKE') {
            const peerId = message.id;
            console.log(`[Antigravity] Handshake received from Peer ID: ${peerId.substr(0, 8)}...`);

            // Store peer info
            this.peers.set(peerId, socket);

            // Establish Secure Session
            if (message.ecdhKey) {
                this.encryption.establishSession(peerId, message.ecdhKey);
            }

            // If we received a handshake but haven't sent one (incoming connection), reply
            // Ideally check connection state. For simplicity, just emit connected.
            this.emit('peer:connected', { id: peerId, socket });

        } else if (message.type === 'MESSAGE') {
            try {
                // Decrypt payload
                const decryptedContent = this.encryption.decrypt(message.fromId, message.payload);
                console.log(`[Antigravity] Encrypted Message from ${message.fromId.substr(0, 8)}: ${decryptedContent}`);

                this.emit('message', {
                    ...message,
                    content: decryptedContent
                });
            } catch (err) {
                console.error('[Antigravity] Decryption Failed:', err.message);
            }
        } else {
            console.warn('[Antigravity] Unknown message type:', message.type);
        }
    }

    /**
     * Handle incoming UDP message (High frequency data)
     * @param {Buffer} msg 
     * @param {Object} rinfo 
     */
    _handleUDPMessage(msg, rinfo) {
        // Handle high-frequency data (Voice/Video)
        // In a real app, first byte might be packet type
        // emitting 'stream' event for processing
        this.emit('stream', { data: msg, from: rinfo });
    }

    /**
     * Send data over TCP (Reliable)
     * @param {net.Socket} socket 
     * @param {Object} data 
     */
    _sendReliable(socket, data) {
        // Appending newline as delimiter
        socket.write(JSON.stringify(data) + '\n');
    }

    /**
     * Send text message to a specific peer ID
     * @param {string} peerId 
     * @param {string} content 
     */
    sendMessage(peerId, content) {
        const socket = this.peers.get(peerId);
        if (!socket) {
            console.error(`[Antigravity] No connection to peer ${peerId}`);
            return;
        }

        // Encrypt content
        const encryptedPayload = this.encryption.encrypt(peerId, content);

        const message = {
            type: 'MESSAGE',
            fromId: this.id,
            payload: encryptedPayload,
            timestamp: Date.now()
        };

        this._sendReliable(socket, message);
    }

    /**
     * Send raw binary data over UDP
     * @param {string} ip 
     * @param {number} port 
     * @param {Buffer} data 
     */
    sendStream(ip, port, data) {
        // Send raw binary over UDP
        this.udpSocket.send(data, port, ip, (err) => {
            if (err) console.error('[Antigravity] UDP Send Error:', err);
        });
    }

    /**
     * Join the network by connecting to a known bootstrap node
     * @param {string} ip 
     * @param {number} port 
     */
    join(ip, port) {
        // TCP connect to bootstrap node
        this.connect(ip, port);

        // Add to DHT
        // In real impl, we would send a FIND_NODE for ourselves to populate buckets
        console.log(`[Antigravity] Joining network via bootstrap: ${ip}:${port}`);
    }
}

module.exports = AntigravityNode;
