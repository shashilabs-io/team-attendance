import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
async function verify() {
    await connectDatabase();
    const startOfDay = new Date('2026-10-03T00:00:00+05:30');
    const endOfDay = new Date('2026-10-03T23:59:59+05:30');
    const sessions = await AttendanceSession.find({
        checkIn: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ checkIn: 1 });
    console.log('=== SESSIONS ON 03-OCT-2026 ===');
    console.log(`Count: ${sessions.length}`);
    let totalMin = 0;
    for (const s of sessions) {
        console.log(`[${s.status}] ${s.name} (${s.registrationNo}) | Task: "${s.task}" | ${s.checkIn.toISOString()} -> ${s.checkOut?.toISOString()} | ${s.durationMinutes}m`);
        totalMin += s.durationMinutes || 0;
    }
    console.log(`Total duration minutes: ${totalMin}`);
    const sessionIds = sessions.map((s) => s._id);
    const events = await AttendanceEvent.find({ sessionId: { $in: sessionIds } }).sort({
        timestamp: 1,
    });
    console.log('\n=== EVENTS FOR 03-OCT-2026 SESSIONS ===');
    console.log(`Count: ${events.length}`);
    for (const e of events) {
        console.log(`[${e.type}] ${e.registrationNo} | EventID: ${e.eventId} | Time: ${e.timestamp.toISOString()} | Task: "${e.task}"`);
    }
    const anyActive = await AttendanceSession.find({
        checkIn: { $gte: startOfDay, $lte: endOfDay },
        status: 'ACTIVE',
    });
    console.log(`\nActive sessions count for historical date (must be 0): ${anyActive.length}`);
    await mongoose.disconnect();
    console.log('\n🔌 Verification complete.');
}
verify().catch((err) => {
    console.error(err);
    process.exit(1);
});
