import mongoose from 'mongoose';
import { env } from './env.js';
export async function connectDatabase() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        const connection = await mongoose.connect(env.MONGODB_URI);
        console.log('✅ MongoDB connected');
        return connection;
    }
    catch (error) {
        console.error('❌ MongoDB connection failed');
        throw error;
    }
}
