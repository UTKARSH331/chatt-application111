import mongoose from "mongoose";

const notificationModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    message: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message"
    },
    type: {
        type: String,
        enum: ["message", "call"],
        default: "message"
    },
    read: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export const Notification = mongoose.model("Notification", notificationModel);
