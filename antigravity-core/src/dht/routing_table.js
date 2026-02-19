const crypto = require('crypto');

/**
 * RoutingTable
 * 
 * Manages the contact information of other nodes using K-buckets.
 * Based on Kademlia.
 */
class RoutingTable {
    constructor(localId, k = 20) {
        this.localId = localId; // Hex string
        this.k = k; // Bucket size
        this.buckets = []; // Array of arrays

        // Initialize 160 buckets (for SHA-1 sized IDs approximately, though we use SHA-256)
        // For simplicity in this demo, we'll use a dynamic array of buckets based on distance
        this.peers = []; // Simplified flat list for demo purposes, behaving like a single large bucket
    }

    /**
     * Add a peer to the routing table
     * @param {Object} peer { id, ip, port }
     */
    addPeer(peer) {
        if (peer.id === this.localId) return;

        const index = this.peers.findIndex(p => p.id === peer.id);
        if (index !== -1) {
            // Update existing
            this.peers[index] = peer;
            // Move to end (most recently seen)
            this.peers.push(this.peers.splice(index, 1)[0]);
        } else {
            // Add new if valid
            if (this.peers.length < this.k) {
                this.peers.push(peer);
            } else {
                // Bucket full policy (simplified: replace oldest if ping fails - omitted for demo)
                // For now, just simplistic replacement
                this.peers.shift();
                this.peers.push(peer);
            }
        }
    }

    /**
     * proper Kademlia distance logic (XOR metric)
     * @param {string} id1 Hex string
     * @param {string} id2 Hex string
     * @returns {BigInt} distance
     */
    static distance(id1, id2) {
        const buf1 = Buffer.from(id1, 'hex');
        const buf2 = Buffer.from(id2, 'hex');
        const temp = Buffer.alloc(Math.max(buf1.length, buf2.length));

        for (let i = 0; i < temp.length; i++) {
            temp[i] = (buf1[i] || 0) ^ (buf2[i] || 0);
        }

        return BigInt('0x' + temp.toString('hex'));
    }

    /**
     * Find k closest peers to a given ID
     * @param {string} targetId 
     * @param {number} count 
     * @returns {Array} closest peers
     */
    findClosestPeers(targetId, count = this.k) {
        return this.peers
            .map(peer => ({
                peer,
                distance: RoutingTable.distance(targetId, peer.id)
            }))
            .sort((a, b) => {
                if (a.distance < b.distance) return -1;
                if (a.distance > b.distance) return 1;
                return 0;
            })
            .slice(0, count)
            .map(p => p.peer);
    }

    getPeer(id) {
        return this.peers.find(p => p.id === id);
    }
}

module.exports = RoutingTable;
