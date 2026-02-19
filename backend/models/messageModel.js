import mongoose from "mongoose";

const messageModel = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: String,
        required: true
    },
    // New fields for deletion
    deletedForEveryone: {
        type: Boolean,
        default: false
    },
    deletedFor: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, { timestamps: true });

export const Message = mongoose.model("Message", messageModel);