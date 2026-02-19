import { Conversation } from "../models/conversationModel.js";

export const getConversations = async (req, res) => {
    try {
        const userId = req.id;

        // Find all conversations involving this user
        const conversations = await Conversation.find({
            participants: { $in: [userId] }
        })
            .populate({
                path: "participants",
                select: "fullName username profilePhoto"
            })
            .populate({
                path: "messages",
                options: { sort: { createdAt: -1 }, limit: 1 },
                select: "message senderId createdAt"
            })
            .sort({ updatedAt: -1 });

        // Format response: extract the other participant and last message
        const formatted = conversations.map(conv => {
            const otherUser = conv.participants.find(
                p => p._id.toString() !== userId
            );
            const lastMessage = conv.messages.length > 0 ? conv.messages[0] : null;

            return {
                _id: conv._id,
                user: otherUser,
                lastMessage: lastMessage ? {
                    text: lastMessage.message,
                    senderId: lastMessage.senderId,
                    createdAt: lastMessage.createdAt
                } : null,
                updatedAt: conv.updatedAt
            };
        }).filter(conv => conv.user != null); // Filter out conversations with deleted users

        return res.status(200).json(formatted);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
