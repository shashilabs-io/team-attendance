import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
export async function testDatabase() {
    try {
        console.log('📡 Connecting to MongoDB for reading users...');
        await connectDatabase();
        const users = await User.find({}).sort({ registrationNo: 1 }).lean();
        console.log(`\n📋 Registered Users in Database (${users.length} found):`);
        if (users.length === 0) {
            console.log('   (No users found. Run `npm run seed` to populate initial team members.)');
        }
        else {
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. [${user.registrationNo}] ${user.name}` +
                    ` | Role: ${user.role} | Discord ID: ${user.discordUserId} | Active: ${user.isActive}`);
            });
        }
        console.log('');
    }
    catch (error) {
        console.error('❌ Failed to test database:', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose.disconnect();
        console.log('🔌 Database connection closed.');
    }
}
// Execute directly if run as a script
if (process.argv[1]?.endsWith('testDatabase.ts') ||
    process.argv[1]?.endsWith('testDatabase.js')) {
    testDatabase();
}
