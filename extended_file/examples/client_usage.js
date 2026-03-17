const { AntigravityClient } = require('../index');

// Simulate two users
const alice = new AntigravityClient(4000);
const bob = new AntigravityClient(4001);

console.log('--- Alice & Bob Client Demo ---');

// Start clients
alice.start();
bob.start();

// Setup UI-like listeners
bob.on('message', (msg) => {
    console.log(`[Bob's UI] New Message from ${msg.senderId}: ${msg.content}`);
});

alice.on('message', (msg) => {
    console.log(`[Alice's UI] New Message from ${msg.senderId}: ${msg.content}`);
});

bob.on('peer:connected', (id) => {
    console.log(`[Bob's UI] Friend connected: ${id}`);

    // Auto-reply
    setTimeout(() => {
        bob.sendMessage(id, 'Hey Alice! Long time no see.');
    }, 1000);
});

alice.on('peer:connected', (id) => {
    console.log(`[Alice's UI] Friend connected: ${id}`);
});

// Connect Alice to Bob
setTimeout(() => {
    console.log('--- Alice initiating connection ---');
    alice.connectToPeer('127.0.0.1', 4001);
}, 1000);

// Send message once connected (simulated delay for handshake)
setTimeout(() => {
    console.log('--- Alice sending message ---');
    // In a real app, Alice would know Bob's ID from the DHT/Contact List
    // Here we cheat and get Bob's ID directly for the demo
    alice.sendMessage(bob.getMyId(), 'Hello Bob!');
}, 2000);
