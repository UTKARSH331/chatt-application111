import mongoose from "mongoose";

const callHistoryModel = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    peerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["incoming", "outgoing"],
        required: true
    },
    status: {
        type: String,
        enum: ["missed", "completed", "rejected"],
        default: "completed"
    },
    duration: {
        type: Number, // seconds
        default: 0
    },
    startedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

export const CallHistory = mongoose.model("CallHistory", callHistoryModel);
