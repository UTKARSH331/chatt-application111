import express from "express";
import { getOtherUsers, login, logout, register, updateProfile, getNotifications, markNotificationsRead } from "../controllers/userController.js";
import { getConversations } from "../controllers/conversationController.js";
import { createCallLog, getCallHistory } from "../controllers/callController.js"; // New imports
import isAuthenticated from "../middleware/isAuthenticated.js";
import multer from "multer";
import path from "path";

const router = express.Router();

// Multer config for profile photo uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('Only image files are allowed'));
    }
});

router.route("/register").post(register);
router.route("/login").post(login);
router.route("/logout").get(logout);
router.route("/").get(isAuthenticated, getOtherUsers);
router.route("/profile").put(isAuthenticated, upload.single('profilePhoto'), updateProfile);
router.route("/conversations").get(isAuthenticated, getConversations);
router.route("/notifications").get(isAuthenticated, getNotifications);
router.route("/notifications/:fromUserId/read").put(isAuthenticated, markNotificationsRead);

// Call History Routes
router.route("/calls/log").post(isAuthenticated, createCallLog);
router.route("/calls/history").get(isAuthenticated, getCallHistory);

export default router;