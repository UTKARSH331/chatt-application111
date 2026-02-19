const crypto = require('crypto');

/**
 * AntigravityEncryption
 * 
 * Implements a simplified E2EE layer inspired by the Signal Protocol.
 * Uses Elliptic Curve Diffie-Hellman (ECDH) for key agreement and AES-256-GCM for encryption.
 */
class AntigravityEncryption {
    constructor() {
        // Generate Identity Key (Long-term)
        this.identityKey = crypto.createECDH('secp256k1');
        this.identityKey.generateKeys();

        // Session storage: PeerId -> { sharedSecret, ... }
        this.sessions = new Map();
    }

    getPublicKey() {
        return this.identityKey.getPublicKey('hex');
    }

    /**
     * computeSharedSecret
     * Perform ECDH to get shared secret
     * @param {string} remotePublicKeyHex 
     * @returns {Buffer} Shared Secret
     */
    computeSharedSecret(remotePublicKeyHex) {
        return this.identityKey.computeSecret(remotePublicKeyHex, 'hex');
    }

    /**
     * Establish session with a peer
     * @param {string} peerId 
     * @param {string} remotePublicKeyHex 
     */
    establishSession(peerId, remotePublicKeyHex) {
        const sharedSecret = this.computeSharedSecret(remotePublicKeyHex);
        this.sessions.set(peerId, { sharedSecret });
        console.log(`[Antigravity] Secure session established with ${peerId.substr(0, 8)}...`);
    }

    /**
     * Encrypt a message for a peer
     * @param {string} peerId 
     * @param {string} plaintext 
     * @returns {Object} { iv, ciphertext, authTag }
     */
    encrypt(peerId, plaintext) {
        const session = this.sessions.get(peerId);
        if (!session) {
            throw new Error(`No secure session with peer ${peerId}`);
        }

        // Derive AES key from shared secret (Simplified HKDF)
        const aesKey = crypto.createHash('sha256').update(session.sharedSecret).digest();
        const iv = crypto.randomBytes(12); // NIST recommended IV length for GCM

        const cipher = crypto.createCipheriv('aes-256-gcm', aesKey, iv);
        let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
        ciphertext += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return {
            iv: iv.toString('hex'),
            ciphertext,
            authTag
        };
    }

    /**
     * Decrypt a message from a peer
     * @param {string} peerId 
     * @param {Object} encryptedPayload { iv, ciphertext, authTag }
     * @returns {string} plaintext
     */
    decrypt(peerId, encryptedPayload) {
        const session = this.sessions.get(peerId);
        if (!session) {
            throw new Error(`No secure session with peer ${peerId}`);
        }

        const aesKey = crypto.createHash('sha256').update(session.sharedSecret).digest();
        const iv = Buffer.from(encryptedPayload.iv, 'hex');
        const authTag = Buffer.from(encryptedPayload.authTag, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', aesKey, iv);
        decipher.setAuthTag(authTag);

        let plaintext = decipher.update(encryptedPayload.ciphertext, 'hex', 'utf8');
        plaintext += decipher.final('utf8');

        return plaintext;
    }
}

module.exports = AntigravityEncryption;
