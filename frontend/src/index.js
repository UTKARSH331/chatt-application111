import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/database.js";
import userRoute from "./routes/userRoute.js";
import messageRoute from "./routes/messageRoute.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./socket/socket.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const PORT = process.env.PORT || 5000;

// 1. High-Priority Middleware: Fix double slashes in URLs (e.g., //api) IMMEDIATELY
app.use((req, res, next) => {
    req.url = req.url.replace(/\/\/+/g, '/');
    next();
});

// 2. Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const corsOption = {
    origin: (origin, callback) => {
        // Sanitize origins: trim spaces and remove trailing slashes
        const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
            .split(',')
            .map(url => url.trim().replace(/\/$/, ""));

        // Sanitize incoming origin
        const cleanOrigin = origin ? origin.replace(/\/$/, "") : null;

        // Auto-allow ANY Vercel domain (previews, branches, etc.)
        const isVercel = cleanOrigin && (cleanOrigin.endsWith(".vercel.app") || cleanOrigin.includes(".vercel.app"));

        if (!origin || allowedOrigins.includes(cleanOrigin) || isVercel) {
            callback(null, true);
        } else {
            console.error(`❌ CORS_BLOCKED: Origin [${origin}] is not in allowed list [${allowedOrigins}] and is not a Vercel domain.`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
};
app.use(cors(corsOption));

// Serve uploaded files as static
app.use('/uploads', express.static(uploadsDir));

// routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/message", messageRoute);

server.listen(PORT, () => {
    connectDB();
    console.log(`Server listen at port ${PORT}`);
});
