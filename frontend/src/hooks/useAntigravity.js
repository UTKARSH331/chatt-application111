import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useAntigravity Hook
 * 
 * React hook to connect the frontend to the Antigravity P2P WebSocket bridge.
 * Provides methods to connect peers, send messages, and receive events.
 */
const useAntigravity = (bridgeUrl = 'ws://localhost:9000') => {
    const [nodeInfo, setNodeInfo] = useState(null);
    const [peers, setPeers] = useState([]);
    const [p2pMessages, setP2pMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(bridgeUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('[Antigravity] Connected to P2P bridge');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'NODE_INFO':
                        setNodeInfo({ nodeId: data.nodeId, port: data.port });
                        break;

                    case 'PEER_CONNECTED':
                        setPeers(prev => [...new Set([...prev, data.peerId])]);
                        break;

                    case 'MESSAGE_RECEIVED':
                        setP2pMessages(prev => [...prev, {
                            fromId: data.fromId,
                            content: data.content,
                            timestamp: data.timestamp
                        }]);
                        break;

                    default:
                        break;
                }
            } catch (err) {
                console.error('[Antigravity] Error parsing bridge message:', err);
            }
        };

        ws.onclose = () => {
            console.log('[Antigravity] Disconnected from P2P bridge');
            setIsConnected(false);
        };

        ws.onerror = (err) => {
            console.error('[Antigravity] WebSocket error:', err);
        };

        return () => {
            ws.close();
        };
    }, [bridgeUrl]);

    const connectPeer = useCallback((ip, port) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'CONNECT_PEER',
                ip,
                port
            }));
        }
    }, []);

    const sendP2PMessage = useCallback((peerId, content) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'SEND_MESSAGE',
                peerId,
                content
            }));
        }
    }, []);

    const joinNetwork = useCallback((bootstrapIp, bootstrapPort) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'JOIN_NETWORK',
                ip: bootstrapIp,
                port: bootstrapPort
            }));
        }
    }, []);

    return {
        nodeInfo,
        peers,
        p2pMessages,
        isConnected,
        connectPeer,
        sendP2PMessage,
        joinNetwork
    };
};

export default useAntigravity;
