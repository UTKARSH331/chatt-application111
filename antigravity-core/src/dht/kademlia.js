const RoutingTable = require('./routing_table');
const EventEmitter = require('events');

/**
 * KademliaDHT
 * 
 * Implements peer discovery logic using the Kademlia protocol.
 */
class KademliaDHT extends EventEmitter {
    constructor(nodeId) {
        super();
        this.nodeId = nodeId;
        this.routingTable = new RoutingTable(nodeId);
    }

    /**
     * Add a known peer to the DHT
     * @param {string} id 
     * @param {string} ip 
     * @param {number} port 
     */
    addNode(id, ip, port) {
        this.routingTable.addPeer({ id, ip, port, lastSeen: Date.now() });
    }

    /**
     * Find closest nodes to a target ID
     * @param {string} targetId 
     * @returns {Array} List of nodes
     */
    findNode(targetId) {
        return this.routingTable.findClosestPeers(targetId);
    }

    /**
     * Handle incoming DHT message
     * @param {Object} message 
     * @param {Object} senderInfo { ip, port }
     * @returns {Object} Response
     */
    handleMessage(message, senderInfo) {
        switch (message.type) {
            case 'PING':
                this.addNode(message.senderId, senderInfo.ip, senderInfo.port);
                return { type: 'PONG', senderId: this.nodeId };

            case 'FIND_NODE':
                this.addNode(message.senderId, senderInfo.ip, senderInfo.port);
                const nodes = this.routingTable.findClosestPeers(message.targetId);
                return { type: 'NODES', senderId: this.nodeId, nodes };

            default:
                return { type: 'ERROR', message: 'Unknown DHT command' };
        }
    }
}

module.exports = KademliaDHT;
