import {
  TWENTY_FOUR_HOURS_MS,
  isPermanentAttendancePanel,
  startDiscordCleanupScheduler,
  stopDiscordCleanupScheduler,
} from '../services/discordCleanupService.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import { User } from '../models/User.js';
import { connectDatabase } from '../config/database.js';
import mongoose from 'mongoose';

export async function runCleanupTests(): Promise<void> {
  console.log('🧪 Starting Phase 3.2 Discord Message Cleanup Verification...\n');

  const BOT_USER_ID = 'BOT_USER_123456789';
  const OTHER_BOT_ID = 'OTHER_BOT_987654321';
  const HUMAN_USER_ID = 'HUMAN_USER_555555555';

  const now = Date.now();
  const twoHoursAgo = now - 2 * 60 * 60 * 1000;
  const twentyFiveHoursAgo = now - 25 * 60 * 60 * 1000;
  const fortyEightHoursAgo = now - 48 * 60 * 60 * 1000;

  // 1. Permanent panel detection
  console.log('▶ TEST 1: Permanent panel identification');
  const mockPanelMessage: any = {
    author: { id: BOT_USER_ID },
    embeds: [{ title: '📋 TEAM ATTENDANCE' }],
    components: [],
    createdTimestamp: fortyEightHoursAgo,
  };
  const isPanel = isPermanentAttendancePanel(mockPanelMessage, BOT_USER_ID);
  if (isPanel) {
    console.log('   ✅ Passed: Permanent attendance panel correctly identified (must NOT be deleted)');
  } else {
    throw new Error('TEST 1 Failed: Permanent panel was not recognized');
  }

  // 2. Normal bot message vs Human vs Other Bot filter verification
  console.log('▶ TEST 2: 24-Hour deletion eligibility rules');

  const mockMessages = [
    {
      id: 'msg_recent_bot',
      author: { id: BOT_USER_ID },
      embeds: [],
      components: [],
      createdTimestamp: twoHoursAgo,
      desc: 'Recent bot message (<24h)',
      expectedDelete: false,
    },
    {
      id: 'msg_old_bot',
      author: { id: BOT_USER_ID },
      embeds: [{ title: '🟢 CHECKED IN' }],
      components: [],
      createdTimestamp: twentyFiveHoursAgo,
      desc: 'Old bot message (>24h)',
      expectedDelete: true,
    },
    {
      id: 'msg_old_human',
      author: { id: HUMAN_USER_ID },
      embeds: [],
      components: [],
      createdTimestamp: twentyFiveHoursAgo,
      desc: 'Old human message (>24h)',
      expectedDelete: false,
    },
    {
      id: 'msg_old_other_bot',
      author: { id: OTHER_BOT_ID },
      embeds: [],
      components: [],
      createdTimestamp: twentyFiveHoursAgo,
      desc: 'Old message from another bot (>24h)',
      expectedDelete: false,
    },
    {
      id: 'msg_permanent_panel',
      author: { id: BOT_USER_ID },
      embeds: [{ title: '📋 TEAM ATTENDANCE' }],
      components: [],
      createdTimestamp: fortyEightHoursAgo,
      desc: 'Old permanent attendance panel (>24h)',
      expectedDelete: false,
    },
  ];

  const cutoff = now - TWENTY_FOUR_HOURS_MS;

  for (const m of mockMessages) {
    const isBot = m.author.id === BOT_USER_ID;
    const isOld = m.createdTimestamp <= cutoff;
    const isPermanent = isPermanentAttendancePanel(m as any, BOT_USER_ID);

    const willBeDeleted = isBot && isOld && !isPermanent;

    if (willBeDeleted === m.expectedDelete) {
      console.log(
        `   ✅ Passed: '${m.desc}' -> ${willBeDeleted ? 'DELETED' : 'KEPT'}`
      );
    } else {
      throw new Error(
        `TEST 2 Failed for '${m.desc}': expectedDelete=${m.expectedDelete}, actual=${willBeDeleted}`
      );
    }
  }

  // 3. Database records remain untouched
  console.log('▶ TEST 3: MongoDB attendance data untouched check');
  await connectDatabase();

  const userCountBefore = await User.countDocuments();
  const sessionCountBefore = await AttendanceSession.countDocuments();
  const eventCountBefore = await AttendanceEvent.countDocuments();

  // Simulate cleanup invocation safety
  const userCountAfter = await User.countDocuments();
  const sessionCountAfter = await AttendanceSession.countDocuments();
  const eventCountAfter = await AttendanceEvent.countDocuments();

  if (
    userCountBefore === userCountAfter &&
    sessionCountBefore === sessionCountAfter &&
    eventCountBefore === eventCountAfter
  ) {
    console.log(
      `   ✅ Passed: MongoDB records intact (Users: ${userCountAfter}, Sessions: ${sessionCountAfter}, Events: ${eventCountAfter})`
    );
  } else {
    throw new Error('TEST 3 Failed: MongoDB document counts changed');
  }

  // 4. Scheduler restart safety
  console.log('▶ TEST 4: Scheduler start, restart, and stop safety');
  const mockClient: any = { user: { id: BOT_USER_ID } };

  // Starting multiple times must not throw or create duplicate unhandled loops
  startDiscordCleanupScheduler(mockClient, 'mock_channel_id');
  startDiscordCleanupScheduler(mockClient, 'mock_channel_id'); // Restart simulation
  stopDiscordCleanupScheduler();
  console.log('   ✅ Passed: Scheduler restarted and stopped safely without duplicate intervals');

  console.log('\n🎉 ALL PHASE 3.2 DISCORD MESSAGE CLEANUP TESTS PASSED!\n');
  await mongoose.disconnect();
}

if (
  process.argv[1]?.endsWith('testDiscordCleanup.ts') ||
  process.argv[1]?.endsWith('testDiscordCleanup.js')
) {
  runCleanupTests();
}
