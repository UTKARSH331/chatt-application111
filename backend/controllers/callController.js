import { CallHistory } from "../models/callHistoryModel.js";

export const createCallLog = async (req, res) => {
    try {
        const userId = req.id;
        const { peerId, type, status, duration } = req.body;

        await CallHistory.create({
            userId,
            peerId,
            type,
            status,
            duration
        });

        return res.status(201).json({ message: "Call log saved" });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getCallHistory = async (req, res) => {
    try {
        const userId = req.id;
        const history = await CallHistory.find({ userId })
            .populate("peerId", "fullName profilePhoto")
            .sort({ startedAt: -1 });

        return res.status(200).json(history);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
