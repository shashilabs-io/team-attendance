import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import {
  checkInUser,
  checkOutUser,
  getActiveSession,
} from '../services/attendanceService.js';
import { prepareCheckInPrompt } from '../bot/commands/checkIn.js';
import { AppError } from './AppError.js';

export async function runAttendanceTests(): Promise<void> {
  const TEST_DISCORD_A = 'TEST_DISCORD_USER_A';
  const TEST_REG_A = 'TEST_REG_A_1001';

  const TEST_DISCORD_B = 'TEST_DISCORD_USER_B';
  const TEST_REG_B = 'TEST_REG_B_1002';

  try {
    console.log('🧪 Starting Phase 3 Attendance & Concurrency Verification...\n');
    await connectDatabase();

    // Clean up any stale test fixtures
    await User.deleteMany({ registrationNo: { $in: [TEST_REG_A, TEST_REG_B] } });
    await AttendanceSession.deleteMany({
      discordUserId: { $in: [TEST_DISCORD_A, TEST_DISCORD_B] },
    });
    await AttendanceEvent.deleteMany({
      discordUserId: { $in: [TEST_DISCORD_A, TEST_DISCORD_B] },
    });

    // Create 2 active registered test members
    await User.create([
      {
        name: 'Attendance Tester A',
        registrationNo: TEST_REG_A,
        discordUserId: TEST_DISCORD_A,
        role: 'MEMBER',
        isActive: true,
      },
      {
        name: 'Attendance Tester B',
        registrationNo: TEST_REG_B,
        discordUserId: TEST_DISCORD_B,
        role: 'MEMBER',
        isActive: true,
      },
    ]);

    // TEST 1: User sends ci -> Task selection appears
    console.log('▶ TEST 1: User sends ci -> Task selection prompt is generated');
    const prompt = await prepareCheckInPrompt(TEST_DISCORD_A);
    if (prompt.content.includes('CHECK IN') && prompt.components.length > 0) {
      console.log('   ✅ Passed: Prompt returned [Enter Task] and [Skip] buttons');
    } else {
      throw new Error('TEST 1 Failed: Prompt structure invalid');
    }

    // TEST 2: Enter Task: "Working on SIH" -> Session ACTIVE, Event CHECK_IN
    console.log('▶ TEST 2: User checks in with task "Working on SIH"');
    const session1 = await checkInUser({
      discordUserId: TEST_DISCORD_A,
      task: 'Working on SIH',
    });
    const event1 = await AttendanceEvent.findOne({
      sessionId: session1._id,
      type: 'CHECK_IN',
    });

    if (
      session1.status === 'ACTIVE' &&
      session1.task === 'Working on SIH' &&
      event1 !== null
    ) {
      console.log('   ✅ Passed: AttendanceSession is ACTIVE, AttendanceEvent CHECK_IN recorded');
    } else {
      throw new Error('TEST 2 Failed: Session or event not created properly');
    }

    // TEST 3: Same user sends ci -> ❌ Already checked in. No duplicate.
    console.log('▶ TEST 3: Duplicate check-in while active is rejected');
    try {
      await checkInUser({
        discordUserId: TEST_DISCORD_A,
        task: 'Another task',
      });
      throw new Error('TEST 3 Failed: Second check-in was allowed');
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'ALREADY_CHECKED_IN') {
        console.log('   ✅ Passed: Rejected with ALREADY_CHECKED_IN ("You are already checked in.")');
      } else {
        throw err;
      }
    }

    // Verify session count is still 1
    const activeCount = await AttendanceSession.countDocuments({
      discordUserId: TEST_DISCORD_A,
      status: 'ACTIVE',
    });
    if (activeCount === 1) {
      console.log('   ✅ Passed: Exactly 1 active session in database');
    } else {
      throw new Error(`TEST 3 Failed: Expected 1 active session, found ${activeCount}`);
    }

    // TEST 4: User sends co -> Session COMPLETED, duration calculated, Event CHECK_OUT
    console.log('▶ TEST 4: User checks out');
    const { session: checkedOutSession, durationMinutes } = await checkOutUser({
      discordUserId: TEST_DISCORD_A,
    });
    const event2 = await AttendanceEvent.findOne({
      sessionId: checkedOutSession._id,
      type: 'CHECK_OUT',
    });

    if (
      checkedOutSession.status === 'COMPLETED' &&
      checkedOutSession.checkOut !== undefined &&
      typeof durationMinutes === 'number' &&
      event2 !== null
    ) {
      console.log(
        `   ✅ Passed: Session COMPLETED with duration ${durationMinutes}m and CHECK_OUT event created`
      );
    } else {
      throw new Error('TEST 4 Failed: Check out did not complete properly');
    }

    // TEST 5: User sends co -> ❌ You are not currently checked in
    console.log('▶ TEST 5: Check-out without active session is rejected');
    try {
      await checkOutUser({ discordUserId: TEST_DISCORD_A });
      throw new Error('TEST 5 Failed: Check-out succeeded without active session');
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'NO_CHECK_IN') {
        console.log('   ✅ Passed: Rejected with NO_CHECK_IN ("You are not currently checked in.")');
      } else {
        throw err;
      }
    }

    // TEST 6: Another registered user can independently check in
    console.log('▶ TEST 6: Independent user B checks in');
    const userBSession = await checkInUser({
      discordUserId: TEST_DISCORD_B,
      task: 'User B frontend design',
    });
    if (userBSession.status === 'ACTIVE' && userBSession.discordUserId === TEST_DISCORD_B) {
      console.log('   ✅ Passed: User B checked in independently');
    }

    // Clean up User B session
    await checkOutUser({ discordUserId: TEST_DISCORD_B });

    // TEST 7: Same user can check in again after checkout (creates another completed session)
    console.log('▶ TEST 7: User A checks in again for second session');
    const session2 = await checkInUser({
      discordUserId: TEST_DISCORD_A,
      task: 'Second session on documentation',
    });
    const userACheckout2 = await checkOutUser({ discordUserId: TEST_DISCORD_A });
    if (userACheckout2.session.status === 'COMPLETED') {
      console.log('   ✅ Passed: Second completed session recorded');
    }

    // TEST 8: Multiple completed sessions on the same day are allowed
    console.log('▶ TEST 8: Verify multiple completed sessions for same user exist');
    const totalCompleted = await AttendanceSession.countDocuments({
      discordUserId: TEST_DISCORD_A,
      status: 'COMPLETED',
    });
    if (totalCompleted === 2) {
      console.log(`   ✅ Passed: Found ${totalCompleted} completed sessions for User A`);
    } else {
      throw new Error(`TEST 8 Failed: Expected 2 completed sessions, found ${totalCompleted}`);
    }

    // TEST 9: Unregistered user sends ci -> ❌ You are not registered as a team member.
    console.log('▶ TEST 9: Unregistered user check-in is rejected');
    try {
      await checkInUser({
        discordUserId: 'UNREGISTERED_DISCORD_USER_9999',
        task: 'Unregistered task',
      });
      throw new Error('TEST 9 Failed: Unregistered user check-in was allowed');
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'USER_NOT_FOUND') {
        console.log('   ✅ Passed: Rejected with USER_NOT_FOUND ("You are not registered as a team member.")');
      } else {
        throw err;
      }
    }

    // TEST 10: Inactive user sends ci -> ❌ Your account is inactive.
    console.log('▶ TEST 10: Inactive user check-in is rejected');
    await User.updateOne({ discordUserId: TEST_DISCORD_B }, { $set: { isActive: false } });
    try {
      await checkInUser({
        discordUserId: TEST_DISCORD_B,
        task: 'Inactive user task',
      });
      throw new Error('TEST 10 Failed: Inactive user check-in was allowed');
    } catch (err: any) {
      if (err instanceof AppError && err.code === 'USER_INACTIVE') {
        console.log('   ✅ Passed: Rejected with USER_INACTIVE ("Your account is inactive.")');
      } else {
        throw err;
      }
    }

    // TEST 11: CONCURRENCY TEST - Two simultaneous check-ins for the same user
    console.log('▶ TEST 11: Concurrency Test - Race condition between two parallel check-ins');
    const [raceRes1, raceRes2] = await Promise.allSettled([
      checkInUser({ discordUserId: TEST_DISCORD_A, task: 'Parallel Task 1' }),
      checkInUser({ discordUserId: TEST_DISCORD_A, task: 'Parallel Task 2' }),
    ]);

    const successes = [raceRes1, raceRes2].filter((r) => r.status === 'fulfilled');
    const rejections = [raceRes1, raceRes2].filter((r) => r.status === 'rejected');

    if (successes.length === 1 && rejections.length === 1) {
      const rejectedReason = (rejections[0] as PromiseRejectedResult).reason;
      if (
        rejectedReason instanceof AppError &&
        rejectedReason.code === 'ALREADY_CHECKED_IN'
      ) {
        console.log('   ✅ Passed: Exactly 1 concurrent check-in succeeded, second rejected with ALREADY_CHECKED_IN');
      } else {
        throw new Error(`Unexpected rejection: ${rejectedReason}`);
      }
    } else {
      throw new Error(
        `Concurrency failed: ${successes.length} succeeded and ${rejections.length} rejected`
      );
    }

    // Check out parallel session
    await checkOutUser({ discordUserId: TEST_DISCORD_A });

    // Cleanup test records
    console.log('\n🧹 Cleaning up test fixtures from database...');
    await User.deleteMany({ registrationNo: { $in: [TEST_REG_A, TEST_REG_B] } });
    await AttendanceSession.deleteMany({
      discordUserId: { $in: [TEST_DISCORD_A, TEST_DISCORD_B] },
    });
    await AttendanceEvent.deleteMany({
      discordUserId: { $in: [TEST_DISCORD_A, TEST_DISCORD_B] },
    });
    console.log('   ✅ Test fixtures cleaned up.\n');

    console.log('🎉 ALL 11 ATTENDANCE BUSINESS & CONCURRENCY TESTS PASSED!');
  } catch (error) {
    console.error('❌ Attendance test suite failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected.');
  }
}

// Execute directly if run as a script
if (
  process.argv[1]?.endsWith('testAttendanceFlow.ts') ||
  process.argv[1]?.endsWith('testAttendanceFlow.js')
) {
  runAttendanceTests();
}
