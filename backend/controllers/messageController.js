import { Conversation } from "../models/conversationModel.js";
import { Message } from "../models/messageModel.js";
import { Notification } from "../models/notificationModel.js";
import { getReceiverSocketId, io, activeChats } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id;
        const { message } = req.body;

        let gotConversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] },
        });

        if (!gotConversation) {
            gotConversation = await Conversation.create({
                participants: [senderId, receiverId]
            })
        };
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });
        if (newMessage) {
            gotConversation.messages.push(newMessage._id);
        };

        // Create notification if receiver is not actively chatting with sender
        const receiverActiveChat = activeChats[receiverId];
        if (receiverActiveChat !== senderId) {
            await Notification.create({
                userId: receiverId,
                fromUserId: senderId,
                message: newMessage._id,
                type: "message"
            });

            // Emit notification event to all user tabs
            io.to(receiverId).emit("notification", {
                fromUserId: senderId,
                messageId: newMessage._id,
                text: message,
                type: "message"
            });
        }

        await Promise.all([gotConversation.save(), newMessage.save()]);

        // SOCKET IO - real-time message to both receiver and sender (for multi-tab sync)
        io.to(receiverId).emit("newMessage", newMessage);
        io.to(senderId).emit("newMessage", newMessage);
        return res.status(201).json({
            newMessage
        })
    } catch (error) {
        console.log(error);
    }
}

export const getMessage = async (req, res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.id;
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate("messages");

        // Filter messages that are deleted for the current user
        const messages = conversation?.messages.filter(msg =>
            !msg.deletedFor.includes(senderId)
        ) || [];

        return res.status(200).json(messages);
    } catch (error) {
        console.log(error);
    }
}

export const deleteMessage = async (req, res) => {
    try {
        const userId = req.id;
        const { messageId } = req.params;
        const { everyone } = req.body; // true = delete for everyone, false = delete for me

        const message = await Message.findById(messageId);
        if (!message) return res.status(404).json({ message: "Message not found" });

        if (everyone) {
            // Only sender can delete for everyone
            if (message.senderId.toString() !== userId) {
                return res.status(403).json({ message: "Unauthorized to delete for everyone" });
            }
            message.deletedForEveryone = true;
            await message.save();

            // Notify receiver via socket room (all tabs)
            const receiverId = message.receiverId.toString();
            io.to(receiverId).emit("messageDeleted", { messageId, everyone: true });
        } else {
            // Delete for me
            if (!message.deletedFor.includes(userId)) {
                message.deletedFor.push(userId);
                await message.save();
            }
        }

        return res.status(200).json({ message: "Message deleted" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}