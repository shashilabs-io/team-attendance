import mongoose from 'mongoose';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AttendanceEvent } from '../models/AttendanceEvent.js';
import { User } from '../models/User.js';
import { getActiveTeamMemberByDiscordId, getActiveTeamMemberByRegistrationNo, } from './userService.js';
import { calculateDurationMinutes } from '../utils/duration.js';
import { generateEventId } from '../utils/eventId.js';
import { getTodayRange, parseDateRange } from '../utils/dateUtils.js';
import { AppError } from '../utils/AppError.js';
/**
 * Retrieves the currently ACTIVE attendance session for a user by Discord ID or Registration Number.
 */
export async function getActiveSession(identifier) {
    return AttendanceSession.findOne({
        $or: [{ discordUserId: identifier }, { registrationNo: identifier }],
        status: 'ACTIVE',
    }).exec();
}
/**
 * Checks in a team member, creating an ACTIVE session and a CHECK_IN audit event.
 * Uses a database transaction for data consistency and handles concurrent race conditions.
 */
export async function checkInUser(params) {
    const { discordUserId, registrationNo, task, remarks, source = 'DISCORD', submissionId } = params;
    // 1-3. Find and validate active user
    let user;
    if (discordUserId) {
        user = await getActiveTeamMemberByDiscordId(discordUserId);
    }
    else if (registrationNo) {
        user = await getActiveTeamMemberByRegistrationNo(registrationNo);
    }
    else {
        throw new AppError('VALIDATION_ERROR', 'discordUserId or registrationNo is required');
    }
    // 4-5. Pre-check for existing active session
    const existingActive = await AttendanceSession.findOne({
        userId: user._id,
        status: 'ACTIVE',
    }).exec();
    if (existingActive) {
        throw new AppError('ALREADY_CHECKED_IN', 'You are already checked in.');
    }
    // 4b. Check duplicate submissionId if provided
    if (submissionId) {
        const existingEvent = await AttendanceEvent.findOne({
            'metadata.submissionId': submissionId,
        }).exec();
        if (existingEvent) {
            throw new AppError('DUPLICATE_SUBMISSION', 'This submission has already been processed.');
        }
    }
    const checkInTimestamp = new Date();
    const normalizedTask = task?.trim() || 'Not specified';
    const normalizedRemarks = remarks?.trim();
    const mongoSession = await mongoose.startSession();
    try {
        let createdSession = null;
        await mongoSession.withTransaction(async () => {
            // 6. Create AttendanceSession
            const sessions = await AttendanceSession.create([
                {
                    userId: user._id,
                    discordUserId: user.discordUserId,
                    name: user.name,
                    registrationNo: user.registrationNo,
                    checkIn: checkInTimestamp,
                    task: normalizedTask,
                    remarks: normalizedRemarks,
                    source,
                    status: 'ACTIVE',
                },
            ], { session: mongoSession });
            const sessionDoc = sessions[0];
            if (!sessionDoc) {
                throw new AppError('DATABASE_ERROR', 'Failed to create attendance session');
            }
            // 7. Create AttendanceEvent
            await AttendanceEvent.create([
                {
                    eventId: generateEventId(),
                    userId: user._id,
                    discordUserId: user.discordUserId,
                    registrationNo: user.registrationNo,
                    type: 'CHECK_IN',
                    sessionId: sessionDoc._id,
                    timestamp: checkInTimestamp,
                    task: normalizedTask,
                    metadata: {
                        source,
                        ...(submissionId ? { submissionId } : {}),
                    },
                },
            ], { session: mongoSession });
            createdSession = sessionDoc;
        });
        if (!createdSession) {
            throw new AppError('DATABASE_ERROR', 'Transaction completed without returning session');
        }
        return createdSession;
    }
    catch (error) {
        // Catch partial unique index violation (e.g. concurrent race condition)
        if (error.code === 11000) {
            throw new AppError('ALREADY_CHECKED_IN', 'You are already checked in.');
        }
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Error during checkInUser:', error);
        throw new AppError('DATABASE_ERROR', 'Something went wrong while recording attendance. Please try again.');
    }
    finally {
        await mongoSession.endSession();
    }
}
/**
 * Checks out a team member, completing their ACTIVE session and creating a CHECK_OUT event.
 * Uses a database transaction to ensure session update and event creation are atomic.
 */
export async function checkOutUser(params) {
    const { discordUserId, registrationNo, task, source, submissionId } = params;
    // 1-2. Find and validate active user
    let user;
    if (discordUserId) {
        user = await getActiveTeamMemberByDiscordId(discordUserId);
    }
    else if (registrationNo) {
        user = await getActiveTeamMemberByRegistrationNo(registrationNo);
    }
    else {
        throw new AppError('VALIDATION_ERROR', 'discordUserId or registrationNo is required');
    }
    // 3-4. Find active session
    const activeSession = await AttendanceSession.findOne({
        userId: user._id,
        status: 'ACTIVE',
    }).exec();
    if (!activeSession) {
        throw new AppError('NO_CHECK_IN', "You don't have an active check-in.");
    }
    // 3b. Check duplicate submissionId if provided
    if (submissionId) {
        const existingEvent = await AttendanceEvent.findOne({
            'metadata.submissionId': submissionId,
        }).exec();
        if (existingEvent) {
            throw new AppError('DUPLICATE_SUBMISSION', 'This submission has already been processed.');
        }
    }
    // 5-6. Calculate checkout duration
    const checkOutTimestamp = new Date();
    const durationMinutes = calculateDurationMinutes(activeSession.checkIn, checkOutTimestamp);
    const eventSource = source || activeSession.source || 'DISCORD';
    const mongoSession = await mongoose.startSession();
    try {
        let completedSession = null;
        await mongoSession.withTransaction(async () => {
            // 7. Update AttendanceSession to COMPLETED
            activeSession.checkOut = checkOutTimestamp;
            activeSession.durationMinutes = durationMinutes;
            activeSession.status = 'COMPLETED';
            if (task?.trim()) {
                activeSession.task = task.trim();
            }
            await activeSession.save({ session: mongoSession });
            // 8. Create AttendanceEvent
            await AttendanceEvent.create([
                {
                    eventId: generateEventId(),
                    userId: user._id,
                    discordUserId: user.discordUserId,
                    registrationNo: user.registrationNo,
                    type: 'CHECK_OUT',
                    sessionId: activeSession._id,
                    timestamp: checkOutTimestamp,
                    task: activeSession.task,
                    metadata: {
                        source: eventSource,
                        ...(submissionId ? { submissionId } : {}),
                    },
                },
            ], { session: mongoSession });
            completedSession = activeSession;
        });
        if (!completedSession) {
            throw new AppError('DATABASE_ERROR', 'Transaction completed without returning session');
        }
        return {
            session: completedSession,
            durationMinutes,
        };
    }
    catch (error) {
        if (error instanceof AppError) {
            throw error;
        }
        console.error('Error during checkOutUser:', error);
        throw new AppError('DATABASE_ERROR', 'Something went wrong while recording attendance. Please try again.');
    }
    finally {
        await mongoSession.endSession();
    }
}
/**
 * Transforms an AttendanceSession document into a clean DTO.
 */
export function formatSessionDTO(session) {
    return {
        id: session._id.toString(),
        userId: session.userId.toString(),
        discordUserId: session.discordUserId,
        name: session.name,
        registrationNo: session.registrationNo,
        checkIn: session.checkIn,
        checkOut: session.checkOut,
        task: session.task,
        remarks: session.remarks,
        source: session.source || 'DISCORD',
        durationMinutes: session.durationMinutes,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
    };
}
/**
 * Queries paginated attendance sessions with filters.
 */
export async function getAttendanceSessions(filters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.userId) {
        if (mongoose.Types.ObjectId.isValid(filters.userId)) {
            query.userId = new mongoose.Types.ObjectId(filters.userId);
        }
        else {
            query.userId = filters.userId;
        }
    }
    if (filters.registrationNo) {
        query.registrationNo = filters.registrationNo;
    }
    if (filters.status) {
        query.status = filters.status;
    }
    const { startDate, endDate } = parseDateRange(filters.startDate, filters.endDate);
    if (startDate || endDate) {
        query.checkIn = {};
        if (startDate)
            query.checkIn.$gte = startDate;
        if (endDate)
            query.checkIn.$lt = endDate;
    }
    const [total, sessions] = await Promise.all([
        AttendanceSession.countDocuments(query),
        AttendanceSession.find(query)
            .sort({ checkIn: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
    ]);
    return {
        data: sessions.map(formatSessionDTO),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
}
/**
 * Returns a single attendance session by MongoDB _id.
 */
export async function getSessionById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError('SESSION_NOT_FOUND', 'Attendance session not found');
    }
    const session = await AttendanceSession.findById(id).exec();
    if (!session) {
        throw new AppError('SESSION_NOT_FOUND', 'Attendance session not found');
    }
    return formatSessionDTO(session);
}
/**
 * Returns currently active team members with dynamic working duration.
 */
export async function getActiveMembers() {
    const now = new Date();
    const sessions = await AttendanceSession.find({ status: 'ACTIVE' })
        .sort({ checkIn: 1 })
        .exec();
    return sessions.map((session) => {
        const durationMinutes = calculateDurationMinutes(session.checkIn, now);
        return {
            name: session.name,
            registrationNo: session.registrationNo,
            checkIn: session.checkIn,
            task: session.task || 'Not specified',
            source: session.source || 'DISCORD',
            durationMinutes,
        };
    });
}
/**
 * Returns all attendance sessions for the current day in IST.
 */
export async function getTodayAttendance() {
    const { startOfToday, startOfTomorrow } = getTodayRange();
    const sessions = await AttendanceSession.find({
        checkIn: { $gte: startOfToday, $lt: startOfTomorrow },
    })
        .sort({ checkIn: -1 })
        .exec();
    return sessions.map(formatSessionDTO);
}
/**
 * Calculates high-level attendance summary metrics for dashboard cards.
 */
export async function getAttendanceSummary() {
    const { startOfToday, startOfTomorrow } = getTodayRange();
    const [totalMembers, activeNow, checkedInTodayUsers, completedToday, minutesAggregate,] = await Promise.all([
        User.countDocuments({ isActive: true }),
        AttendanceSession.countDocuments({ status: 'ACTIVE' }),
        AttendanceSession.distinct('registrationNo', {
            checkIn: { $gte: startOfToday, $lt: startOfTomorrow },
        }),
        AttendanceSession.countDocuments({
            status: 'COMPLETED',
            checkIn: { $gte: startOfToday, $lt: startOfTomorrow },
        }),
        AttendanceSession.aggregate([
            {
                $match: {
                    status: 'COMPLETED',
                    checkIn: { $gte: startOfToday, $lt: startOfTomorrow },
                },
            },
            {
                $group: {
                    _id: null,
                    totalMinutes: { $sum: '$durationMinutes' },
                },
            },
        ]),
    ]);
    const totalMinutesToday = minutesAggregate.length > 0 && minutesAggregate[0]?.totalMinutes
        ? minutesAggregate[0].totalMinutes
        : 0;
    return {
        totalMembers,
        activeNow,
        checkedInToday: checkedInTodayUsers.length,
        completedToday,
        totalMinutesToday,
    };
}
/**
 * Calculates daily aggregated stats for charts.
 */
export async function getDailyStats(startDateStr, endDateStr) {
    const match = {};
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
    if (startDate || endDate) {
        match.checkIn = {};
        if (startDate)
            match.checkIn.$gte = startDate;
        if (endDate)
            match.checkIn.$lt = endDate;
    }
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $project: {
                date: {
                    $dateToString: {
                        format: '%Y-%m-%d',
                        date: '$checkIn',
                        timezone: '+05:30',
                    },
                },
                registrationNo: '$registrationNo',
                durationMinutes: { $ifNull: ['$durationMinutes', 0] },
            },
        },
        {
            $group: {
                _id: '$date',
                sessions: { $sum: 1 },
                membersSet: { $addToSet: '$registrationNo' },
                totalMinutes: { $sum: '$durationMinutes' },
            },
        },
        {
            $project: {
                _id: 0,
                date: '$_id',
                sessions: 1,
                members: { $size: '$membersSet' },
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$sessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$sessions'] }, 1] },
                        0,
                    ],
                },
            },
        },
        { $sort: { date: 1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * Calculates member-level stats sorted by total working minutes descending.
 */
export async function getMemberStats(startDateStr, endDateStr) {
    const match = {};
    const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
    if (startDate || endDate) {
        match.checkIn = {};
        if (startDate)
            match.checkIn.$gte = startDate;
        if (endDate)
            match.checkIn.$lt = endDate;
    }
    const pipeline = [
        ...(Object.keys(match).length > 0 ? [{ $match: match }] : []),
        {
            $group: {
                _id: '$userId',
                name: { $first: '$name' },
                registrationNo: { $first: '$registrationNo' },
                sessions: { $sum: 1 },
                totalMinutes: { $sum: { $ifNull: ['$durationMinutes', 0] } },
            },
        },
        {
            $project: {
                _id: 0,
                userId: { $toString: '$_id' },
                name: 1,
                registrationNo: 1,
                sessions: 1,
                totalMinutes: 1,
                averageMinutes: {
                    $cond: [
                        { $gt: ['$sessions', 0] },
                        { $round: [{ $divide: ['$totalMinutes', '$sessions'] }, 1] },
                        0,
                    ],
                },
            },
        },
        { $sort: { totalMinutes: -1 } },
    ];
    return AttendanceSession.aggregate(pipeline);
}
/**
 * Queries paginated immutable attendance event audit records.
 */
export async function getAttendanceEvents(filters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const skip = (page - 1) * limit;
    const query = {};
    if (filters.userId) {
        if (mongoose.Types.ObjectId.isValid(filters.userId)) {
            query.userId = new mongoose.Types.ObjectId(filters.userId);
        }
        else {
            query.userId = filters.userId;
        }
    }
    if (filters.type) {
        query.type = filters.type;
    }
    const { startDate, endDate } = parseDateRange(filters.startDate, filters.endDate);
    if (startDate || endDate) {
        query.timestamp = {};
        if (startDate)
            query.timestamp.$gte = startDate;
        if (endDate)
            query.timestamp.$lt = endDate;
    }
    const [total, events] = await Promise.all([
        AttendanceEvent.countDocuments(query),
        AttendanceEvent.find(query)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .exec(),
    ]);
    return {
        data: events.map((event) => ({
            eventId: event.eventId,
            userId: event.userId.toString(),
            discordUserId: event.discordUserId,
            registrationNo: event.registrationNo,
            type: event.type,
            sessionId: event.sessionId.toString(),
            timestamp: event.timestamp,
            task: event.task,
            metadata: event.metadata,
            createdAt: event.createdAt,
        })),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit) || 1,
        },
    };
}
