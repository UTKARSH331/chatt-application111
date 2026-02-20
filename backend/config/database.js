import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error("❌ MONGODB_ERROR: MONGO_URI is missing from environment variables!");
        return;
    }

    if (uri.includes("<password>")) {
        console.error("❌ MONGODB_ERROR: You still have '<password>' in your connection string! Replace it with your actual password.");
        return;
    }

    // Census the URI for logging to help user debug without leaking secrets
    const censoredUri = uri.replace(/\/\/.*@/, "//****:****@");
    console.log(`📡 Attempting to connect to: ${censoredUri}`);

    try {
        await mongoose.connect(uri);
        console.log('✅ Database connected successfully');
    } catch (error) {
        console.error("❌ MONGODB_CONNECTION_FAILED:");
        console.error(error.message);
        if (error.message.includes("bad auth")) {
            console.error("👉 TIP: Authentication failed. This usually means your PASSWORD is wrong.");
            console.error("👉 TRY THIS: In Atlas, go to Database Access -> Edit User -> Change Password. Use a simple password like 'MyPassword123' (no @ or #).");
        }
    }
};
export default connectDB;
