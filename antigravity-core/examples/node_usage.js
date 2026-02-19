const { AntigravityNode } = require('../index');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../verification.log');

function log(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    console.log(message);
    fs.appendFileSync(logFile, line);
}

// Clear previous log
fs.writeFileSync(logFile, '');

// Create two nodes to simulate a P2P connection
const nodeA = new AntigravityNode(3000);
const nodeB = new AntigravityNode(3001);

log('--- Starting Nodes ---');
nodeA.start();
nodeB.start();

// Listen for connection events
nodeB.on('peer:connected', ({ id }) => {
    log(`[Node B] Connected to peer: ${id.substr(0, 8)}`);

    // Send a message back
    log('[Node B] Sending greeting to Node A...');
    // Note: Node B needs to have established a session from the received handshake
    // The architecture handles this automatically on handshake receipt
    setTimeout(() => {
        nodeB.sendMessage(id, 'Secret Hello from Node B!');
    }, 500);
});

nodeA.on('peer:connected', ({ id }) => {
    log(`[Node A] Connected to peer: ${id.substr(0, 8)}`);
});

// Listen for messages
nodeA.on('message', (msg) => {
    log(`[Node A] Received Decrypted: ${msg.content}`);
});

nodeB.on('message', (msg) => {
    log(`[Node B] Received Decrypted: ${msg.content}`);
});

// Simulate connection after a slight delay to ensure servers are up
setTimeout(() => {
    log('--- Node A Connecting to Node B ---');
    nodeA.connect('127.0.0.1', 3001);
}, 1000);

// Simulate UDP Stream (e.g., Voice Data) mechanism remains same (unencrypted in this demo)
setTimeout(() => {
    log('--- Simulating UDP Data Stream ---');
    const data = Buffer.from('Voice/Video Packet Data');
    nodeA.sendStream('127.0.0.1', 3001, data);
}, 3000);

// Listen for UDP streams
nodeB.on('stream', ({ data, from }) => {
    log(`[Node B] Received UDP Stream from ${from.address}:${from.port}: ${data.toString()}`);
});
