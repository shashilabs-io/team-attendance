import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import { calculateDurationMinutes, formatDuration } from '../utils/duration.js';
import { generateEventId } from '../utils/eventId.js';
const HISTORICAL_DATA = [
    {
        registrationNo: '24105110043',
        expectedName: 'Sejal Singh',
        checkInIso: '2026-10-03T15:30:45+05:30',
        checkOutIso: '2026-10-03T16:43:52+05:30',
        task: 'LlamaIndex ( context + RAG implementation)',
        migrationId: 'HISTORICAL-2026-10-03-24105110043-153045',
        formattedDisplay: {
            checkIn: '03-Oct-2026 15:30:45',
            checkOut: '16:43:52',
        },
    },
    {
        registrationNo: '24105110030',
        expectedName: 'Satyam Kumar Pandey',
        checkInIso: '2026-10-03T17:47:34+05:30',
        checkOutIso: '2026-10-03T18:46:57+05:30',
        task: 'Studying (langchain)',
        migrationId: 'HISTORICAL-2026-10-03-24105110030-174734',
        formattedDisplay: {
            checkIn: '03-Oct-2026 17:47:34',
            checkOut: '18:46:57',
        },
    },
    {
        registrationNo: '24105110087',
        expectedName: 'Shashi Bhushan',
        checkInIso: '2026-10-03T19:10:55+05:30',
        checkOutIso: '2026-10-03T20:33:20+05:30',
        task: 'Building Web Interface of Attendance System',
        migrationId: 'HISTORICAL-2026-10-03-24105110087-191055',
        formattedDisplay: {
            checkIn: '03-Oct-2026 19:10:55',
            checkOut: '20:33:20',
        },
    },
    {
        registrationNo: '24105110072',
        expectedName: 'Rana Pratap Mishra',
        checkInIso: '2026-10-03T21:53:29+05:30',
        checkOutIso: '2026-10-03T23:52:30+05:30',
        task: 'Working on retrivers',
        migrationId: 'HISTORICAL-2026-10-03-24105110072-215329',
        formattedDisplay: {
            checkIn: '03-Oct-2026 21:53:29',
            checkOut: '23:52:30',
        },
    },
    {
        registrationNo: '24105110087',
        expectedName: 'Shashi Bhushan',
        checkInIso: '2026-10-04T09:13:55+05:30',
        checkOutIso: '2026-10-04T11:16:41+05:30',
        task: 'discord',
        migrationId: 'HISTORICAL-2026-10-04-24105110087-091355',
        formattedDisplay: {
            checkIn: '04-Oct-2026 09:13:55',
            checkOut: '11:16:41',
        },
    },
];
export async function runHistoricalMigration() {
    console.log('Historical Attendance Migration\n');
    try {
        await connectDatabase();
        // STEP 1: Verify all expected users exist
        const userMap = new Map();
        const missingUsers = [];
        for (const record of HISTORICAL_DATA) {
            const user = await User.findOne({ registrationNo: record.registrationNo });
            if (!user) {
                missingUsers.push(`${record.expectedName} (${record.registrationNo})`);
            }
            else {
                userMap.set(record.registrationNo, user);
            }
        }
        if (missingUsers.length > 0) {
            console.error('❌ MIGRATION HALTED: The following required users are missing from MongoDB:');
            for (const missing of missingUsers) {
                console.error(`   - ${missing}`);
            }
            console.error('Do NOT automatically create users. Please verify User documents in MongoDB first.');
            process.exit(1);
        }
        let sessionsImported = 0;
        let eventsImported = 0;
        let sessionsSkipped = 0;
        let totalMinutesAccumulated = 0;
        // STEP 2 & 3: Process each historical attendance record
        for (const record of HISTORICAL_DATA) {
            const user = userMap.get(record.registrationNo);
            const checkInDate = new Date(record.checkInIso);
            const checkOutDate = new Date(record.checkOutIso);
            // Duration calculation using project logic
            const durationMinutes = calculateDurationMinutes(checkInDate, checkOutDate);
            // STEP 2: Duplicate check
            // A record with the same user and exact check-in / check-out timestamps must not be inserted twice.
            const existingSession = await AttendanceSession.findOne({
                userId: user._id,
                checkIn: checkInDate,
                checkOut: checkOutDate,
            });
            if (existingSession) {
                console.log(`⚠ ${user.name}`);
                console.log(`  ${record.registrationNo}`);
                console.log(`  ${record.formattedDisplay.checkIn} → ${record.formattedDisplay.checkOut}`);
                console.log(`  ${durationMinutes} minutes`);
                console.log('  Skipped (Already exists in database)\n');
                sessionsSkipped++;
                totalMinutesAccumulated += existingSession.durationMinutes ?? durationMinutes;
                continue;
            }
            // STEP 3: Create AttendanceSession
            const sessionDoc = await AttendanceSession.create({
                userId: user._id,
                discordUserId: user.discordUserId,
                name: user.name,
                registrationNo: user.registrationNo,
                checkIn: checkInDate,
                checkOut: checkOutDate,
                task: record.task,
                remarks: `Imported historical attendance [${record.migrationId}]`,
                durationMinutes,
                status: 'COMPLETED',
            });
            // STEP 4: Create AttendanceEvents (1 CHECK_IN, 1 CHECK_OUT)
            await AttendanceEvent.create([
                {
                    eventId: generateEventId(),
                    userId: user._id,
                    discordUserId: user.discordUserId,
                    registrationNo: user.registrationNo,
                    type: 'CHECK_IN',
                    sessionId: sessionDoc._id,
                    timestamp: checkInDate,
                    task: record.task,
                    metadata: {
                        migrationId: record.migrationId,
                        historical: true,
                    },
                },
                {
                    eventId: generateEventId(),
                    userId: user._id,
                    discordUserId: user.discordUserId,
                    registrationNo: user.registrationNo,
                    type: 'CHECK_OUT',
                    sessionId: sessionDoc._id,
                    timestamp: checkOutDate,
                    task: record.task,
                    metadata: {
                        migrationId: record.migrationId,
                        historical: true,
                        durationMinutes,
                    },
                },
            ]);
            sessionsImported++;
            eventsImported += 2;
            totalMinutesAccumulated += durationMinutes;
            console.log(`✓ ${user.name}`);
            console.log(`  ${record.registrationNo}`);
            console.log(`  ${record.formattedDisplay.checkIn} → ${record.formattedDisplay.checkOut}`);
            console.log(`  ${durationMinutes} minutes`);
            console.log('  Imported\n');
        }
        console.log('Migration complete.\n');
        console.log(`Sessions imported: ${sessionsImported}`);
        if (sessionsSkipped > 0) {
            console.log(`Sessions skipped (duplicates): ${sessionsSkipped}`);
        }
        console.log(`Events imported: ${eventsImported}`);
        console.log(`Total duration: ${totalMinutesAccumulated} minutes`);
        console.log(`Total duration: ${formatDuration(totalMinutesAccumulated)}`);
    }
    catch (error) {
        console.error('❌ Migration failed with error:', error);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        console.log('\n🔌 MongoDB connection closed.');
    }
}
// Execute directly if run as a script
if (import.meta.url.endsWith(process.argv[1]?.replace(/\\/g, '/') || '')) {
    runHistoricalMigration();
}
else {
    runHistoricalMigration();
}
