import mongoose from "mongoose";

const connectDB = async () => {
    const uri = process.env.MONGO_URI;

    if (!uri) {
        console.error("❌ MONGODB_ERROR: MONGO_URI is missing from environment variables!");
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
            console.error("👉 TIP: Double check your username and password in Atlas. Ensure they are correctly URL-encoded if they contain special characters.");
        }
    }
};
export default connectDB;
