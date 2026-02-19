import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: [process.env.FRONTEND_URL || 'http://localhost:3000'],
        methods: ['GET', 'POST'],
    },
});

export const getReceiverSocketId = (receiverId) => {
    return userSocketMap[receiverId];
}

const userSocketMap = {}; // {userId->socketId}
const activeChats = {};   // {userId->currentlyViewingUserId}

// Room tracking for group calls: { roomId: [socketId1, socketId2, ...] }
const callRooms = {};

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId !== undefined) {
        userSocketMap[userId] = socket.id;
        socket.join(userId); // Join room named after userId for multi-tab sync
    }

    io.emit('getOnlineUsers', Object.keys(userSocketMap));

    // --- Active Chat Tracking ---
    socket.on('setActiveChat', (chatUserId) => {
        activeChats[userId] = chatUserId;
    });

    socket.on('clearActiveChat', () => {
        delete activeChats[userId];
    });

    // --- Typing Indicators ---
    socket.on('typing', ({ receiverId }) => {
        io.to(receiverId).emit('userTyping', { senderId: userId });
    });

    socket.on('stopTyping', ({ receiverId }) => {
        io.to(receiverId).emit('userStopTyping', { senderId: userId });
    });

    // --- 1-on-1 Voice Call Signaling ---
    socket.on('callUser', ({ to, offer, callerName, callerPhoto }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('incomingCall', {
                from: userId,
                callerName,
                callerPhoto,
                offer
            });
        }
    });

    socket.on('answerCall', ({ to, answer }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callAnswered', { answer });
        }
    });

    socket.on('iceCandidate', ({ to, candidate }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('iceCandidate', { candidate });
        }
    });

    socket.on('endCall', ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callEnded');
        }
    });

    socket.on('rejectCall', ({ to }) => {
        const receiverSocketId = userSocketMap[to];
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('callRejected');
        }
    });

    // --- Group Call Signaling ---
    socket.on('joinRoom', ({ roomId }) => {
        if (!callRooms[roomId]) {
            callRooms[roomId] = [];
        }
        callRooms[roomId].push(socket.id);
        socket.join(roomId);

        // Notify others in room
        const others = callRooms[roomId].filter(id => id !== socket.id);
        socket.emit('roomUsers', others);
    });

    socket.on('offerRoom', ({ offer, to, roomId }) => {
        io.to(to).emit('offerRoom', { offer, from: socket.id, roomId });
    });

    socket.on('answerRoom', ({ answer, to, roomId }) => {
        io.to(to).emit('answerRoom', { answer, from: socket.id, roomId });
    });

    socket.on('iceCandidateRoom', ({ candidate, to, roomId }) => {
        io.to(to).emit('iceCandidateRoom', { candidate, from: socket.id, roomId });
    });

    socket.on('leaveRoom', ({ roomId }) => {
        if (callRooms[roomId]) {
            callRooms[roomId] = callRooms[roomId].filter(id => id !== socket.id);
            socket.leave(roomId);
            socket.to(roomId).emit('userLeftRoom', socket.id);
        }
    });

    // --- Message Deletion ---
    socket.on('deleteMessage', ({ messageId, receiverId, everyone }) => {
        io.to(receiverId).emit('messageDeleted', { messageId, everyone });
    });

    // --- Disconnect ---
    socket.on('disconnect', () => {
        delete userSocketMap[userId];
        delete activeChats[userId];

        // Remove from all rooms
        Object.keys(callRooms).forEach(roomId => {
            if (callRooms[roomId].includes(socket.id)) {
                callRooms[roomId] = callRooms[roomId].filter(id => id !== socket.id);
                io.to(roomId).emit('userLeftRoom', socket.id);
            }
        });

        io.emit('getOnlineUsers', Object.keys(userSocketMap));
    });
});

export { app, io, server, activeChats };
