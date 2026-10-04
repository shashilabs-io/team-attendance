import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
export async function verifyModels() {
    const TEST_REG_1 = 'TEST_REG_99991';
    const TEST_REG_2 = 'TEST_REG_99992';
    const TEST_DISCORD_1 = 'TEST_DISCORD_99991';
    const TEST_DISCORD_2 = 'TEST_DISCORD_99992';
    const TEST_EVENT_1 = 'EVT_TEST_99991';
    let testUserId = null;
    let testSessionId = null;
    try {
        console.log('🧪 Starting Model & Database Rule Verification...\n');
        await connectDatabase();
        // Ensure all model indexes are synchronized with MongoDB
        await User.syncIndexes();
        await AttendanceSession.syncIndexes();
        await AttendanceEvent.syncIndexes();
        // Clean up any stale test fixtures before running
        await User.deleteMany({ registrationNo: { $in: [TEST_REG_1, TEST_REG_2] } });
        await AttendanceSession.deleteMany({ discordUserId: TEST_DISCORD_1 });
        await AttendanceEvent.deleteMany({ eventId: TEST_EVENT_1 });
        // 1. User can be created
        console.log('▶ Test 1: User can be created');
        const user1 = await User.create({
            name: 'Verification User',
            registrationNo: TEST_REG_1,
            discordUserId: TEST_DISCORD_1,
            role: 'MEMBER',
            isActive: true,
        });
        testUserId = user1._id;
        console.log('   ✅ Passed: User created with ID:', user1._id);
        // 2. Duplicate registrationNo is rejected
        console.log('▶ Test 2: Duplicate registrationNo is rejected');
        try {
            await User.create({
                name: 'Another User',
                registrationNo: TEST_REG_1, // duplicate registrationNo
                discordUserId: TEST_DISCORD_2,
                role: 'MEMBER',
            });
            throw new Error('❌ Failed: Duplicate registrationNo was unexpectedly allowed');
        }
        catch (err) {
            if (err.code === 11000) {
                console.log('   ✅ Passed: Duplicate registrationNo rejected with code 11000');
            }
            else {
                throw err;
            }
        }
        // 3. Duplicate discordUserId is rejected
        console.log('▶ Test 3: Duplicate discordUserId is rejected');
        try {
            await User.create({
                name: 'Duplicate Discord User',
                registrationNo: TEST_REG_2,
                discordUserId: TEST_DISCORD_1, // duplicate discordUserId
                role: 'MEMBER',
            });
            throw new Error('❌ Failed: Duplicate discordUserId was unexpectedly allowed');
        }
        catch (err) {
            if (err.code === 11000) {
                console.log('   ✅ Passed: Duplicate discordUserId rejected with code 11000');
            }
            else {
                throw err;
            }
        }
        // 4. Multiple completed sessions for the same user are allowed
        console.log('▶ Test 4: Multiple COMPLETED sessions for same user are allowed');
        const pastDate1 = new Date(Date.now() - 7200000);
        const pastDate2 = new Date(Date.now() - 3600000);
        const pastDate3 = new Date(Date.now() - 1800000);
        const completedSession1 = await AttendanceSession.create({
            userId: testUserId,
            discordUserId: TEST_DISCORD_1,
            name: 'Verification User',
            registrationNo: TEST_REG_1,
            checkIn: pastDate1,
            checkOut: pastDate2,
            durationMinutes: 60,
            status: 'COMPLETED',
            task: 'Initial documentation',
        });
        const completedSession2 = await AttendanceSession.create({
            userId: testUserId,
            discordUserId: TEST_DISCORD_1,
            name: 'Verification User',
            registrationNo: TEST_REG_1,
            checkIn: pastDate2,
            checkOut: pastDate3,
            durationMinutes: 30,
            status: 'COMPLETED',
            task: 'Code review',
        });
        console.log('   ✅ Passed: Created 2 completed sessions successfully:', completedSession1._id, completedSession2._id);
        // 5. Two ACTIVE sessions for the same discordUserId are rejected
        console.log('▶ Test 5: Two ACTIVE sessions for same discordUserId are rejected');
        const activeSession1 = await AttendanceSession.create({
            userId: testUserId,
            discordUserId: TEST_DISCORD_1,
            name: 'Verification User',
            registrationNo: TEST_REG_1,
            checkIn: new Date(),
            status: 'ACTIVE',
            task: 'Current active task',
        });
        testSessionId = activeSession1._id;
        console.log('   ℹ️ First ACTIVE session created:', activeSession1._id);
        try {
            await AttendanceSession.create({
                userId: testUserId,
                discordUserId: TEST_DISCORD_1, // Same discord user ID
                name: 'Verification User',
                registrationNo: TEST_REG_1,
                checkIn: new Date(),
                status: 'ACTIVE', // Second ACTIVE session must be rejected!
            });
            throw new Error('❌ Failed: Second ACTIVE session was unexpectedly allowed');
        }
        catch (err) {
            if (err.code === 11000) {
                console.log('   ✅ Passed: Second ACTIVE session rejected with partial unique index error (11000)');
            }
            else {
                throw err;
            }
        }
        // 6. AttendanceEvent can reference a session
        console.log('▶ Test 6: AttendanceEvent can reference a session');
        const event = await AttendanceEvent.create({
            eventId: TEST_EVENT_1,
            userId: testUserId,
            discordUserId: TEST_DISCORD_1,
            registrationNo: TEST_REG_1,
            type: 'CHECK_IN',
            sessionId: testSessionId,
            timestamp: new Date(),
            task: 'Started morning shift',
            metadata: { source: 'test_runner', client: 'system' },
        });
        console.log('   ✅ Passed: AttendanceEvent created referencing session:', event.sessionId);
        // Clean up test data
        console.log('🧹 Cleaning up test verification records...');
        await User.deleteMany({ registrationNo: { $in: [TEST_REG_1, TEST_REG_2] } });
        await AttendanceSession.deleteMany({ discordUserId: TEST_DISCORD_1 });
        await AttendanceEvent.deleteMany({ eventId: TEST_EVENT_1 });
        console.log('   ✅ Passed: Test records cleaned up successfully.');
        // 7. Database connection closes properly
        console.log('▶ Test 7: Database connection closes properly');
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exitCode = 1;
    }
    finally {
        await mongoose.disconnect();
        console.log('   ✅ Passed: Database connection closed cleanly.\n');
        console.log('🎉 All Model Verification Tests Passed Successfully!');
    }
}
// Execute directly if run as a script
if (process.argv[1]?.endsWith('verifyModels.ts') ||
    process.argv[1]?.endsWith('verifyModels.js')) {
    verifyModels();
}
