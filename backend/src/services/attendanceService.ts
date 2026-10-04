import mongoose, { ClientSession, FilterQuery } from 'mongoose';
import { AttendanceSession, AttendanceSessionDocument } from '../models/AttendanceSession.js';
import { AttendanceEvent, IAttendanceEvent } from '../models/AttendanceEvent.js';
import { User } from '../models/User.js';
import { getActiveTeamMemberByDiscordId } from './userService.js';
import { calculateDurationMinutes } from '../utils/duration.js';
import { generateEventId } from '../utils/eventId.js';
import { getTodayRange, parseDateRange } from '../utils/dateUtils.js';
import { AppError } from '../utils/AppError.js';

export interface CheckInParams {
  discordUserId: string;
  task?: string;
  remarks?: string;
}

export interface CheckOutParams {
  discordUserId: string;
  task?: string;
}

export interface CheckOutResult {
  session: AttendanceSessionDocument;
  durationMinutes: number;
}

/**
 * Retrieves the currently ACTIVE attendance session for a Discord user, if one exists.
 */
export async function getActiveSession(
  discordUserId: string
): Promise<AttendanceSessionDocument | null> {
  return AttendanceSession.findOne({
    discordUserId,
    status: 'ACTIVE',
  }).exec();
}

/**
 * Checks in a team member, creating an ACTIVE session and a CHECK_IN audit event.
 * Uses a database transaction for data consistency and handles concurrent race conditions.
 */
export async function checkInUser(
  params: CheckInParams
): Promise<AttendanceSessionDocument> {
  const { discordUserId, task, remarks } = params;

  // 1-3. Find and validate active user
  const user = await getActiveTeamMemberByDiscordId(discordUserId);

  // 4-5. Pre-check for existing active session
  const existingActive = await getActiveSession(discordUserId);
  if (existingActive) {
    throw new AppError('ALREADY_CHECKED_IN', 'You are already checked in.');
  }

  const checkInTimestamp = new Date();
  const normalizedTask = task?.trim() || 'Not specified';
  const normalizedRemarks = remarks?.trim();

  const mongoSession = await mongoose.startSession();

  try {
    let createdSession: AttendanceSessionDocument | null = null;

    await mongoSession.withTransaction(async () => {
      // 6. Create AttendanceSession
      const sessions = await AttendanceSession.create(
        [
          {
            userId: user._id,
            discordUserId: user.discordUserId,
            name: user.name,
            registrationNo: user.registrationNo,
            checkIn: checkInTimestamp,
            task: normalizedTask,
            remarks: normalizedRemarks,
            status: 'ACTIVE',
          },
        ],
        { session: mongoSession }
      );

      const sessionDoc = sessions[0];
      if (!sessionDoc) {
        throw new AppError('DATABASE_ERROR', 'Failed to create attendance session');
      }

      // 7. Create AttendanceEvent
      await AttendanceEvent.create(
        [
          {
            eventId: generateEventId(),
            userId: user._id,
            discordUserId: user.discordUserId,
            registrationNo: user.registrationNo,
            type: 'CHECK_IN',
            sessionId: sessionDoc._id,
            timestamp: checkInTimestamp,
            task: normalizedTask,
          },
        ],
        { session: mongoSession }
      );

      createdSession = sessionDoc;
    });

    if (!createdSession) {
      throw new AppError('DATABASE_ERROR', 'Transaction completed without returning session');
    }

    return createdSession;
  } catch (error: any) {
    // Catch partial unique index violation (e.g. concurrent race condition)
    if (error.code === 11000) {
      throw new AppError('ALREADY_CHECKED_IN', 'You are already checked in.');
    }

    if (error instanceof AppError) {
      throw error;
    }

    console.error('Error during checkInUser:', error);
    throw new AppError(
      'DATABASE_ERROR',
      'Something went wrong while recording attendance. Please try again.'
    );
  } finally {
    await mongoSession.endSession();
  }
}

/**
 * Checks out a team member, completing their ACTIVE session and creating a CHECK_OUT event.
 * Uses a database transaction to ensure session update and event creation are atomic.
 */
export async function checkOutUser(
  params: CheckOutParams
): Promise<CheckOutResult> {
  const { discordUserId, task } = params;

  // 1-2. Find and validate active user
  const user = await getActiveTeamMemberByDiscordId(discordUserId);

  // 3-4. Find active session
  const activeSession = await getActiveSession(discordUserId);
  if (!activeSession) {
    throw new AppError('NO_CHECK_IN', "You don't have an active check-in.");
  }

  // 5-6. Calculate checkout duration
  const checkOutTimestamp = new Date();
  const durationMinutes = calculateDurationMinutes(
    activeSession.checkIn,
    checkOutTimestamp
  );

  const mongoSession = await mongoose.startSession();

  try {
    let completedSession: AttendanceSessionDocument | null = null;

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
      await AttendanceEvent.create(
        [
          {
            eventId: generateEventId(),
            userId: user._id,
            discordUserId: user.discordUserId,
            registrationNo: user.registrationNo,
            type: 'CHECK_OUT',
            sessionId: activeSession._id,
            timestamp: checkOutTimestamp,
            task: activeSession.task,
          },
        ],
        { session: mongoSession }
      );

      completedSession = activeSession;
    });

    if (!completedSession) {
      throw new AppError('DATABASE_ERROR', 'Transaction completed without returning session');
    }

    return {
      session: completedSession,
      durationMinutes,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }

    console.error('Error during checkOutUser:', error);
    throw new AppError(
      'DATABASE_ERROR',
      'Something went wrong while recording attendance. Please try again.'
    );
  } finally {
    await mongoSession.endSession();
  }
}

// ==========================================
// Dashboard Read-Only Query Services
// ==========================================

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttendanceSessionDTO {
  id: string;
  userId: string;
  discordUserId: string;
  name: string;
  registrationNo: string;
  checkIn: Date;
  checkOut?: Date;
  task?: string;
  remarks?: string;
  durationMinutes?: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceEventDTO {
  eventId: string;
  userId: string;
  discordUserId: string;
  registrationNo: string;
  type: string;
  sessionId: string;
  timestamp: Date;
  task?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ActiveMemberDTO {
  name: string;
  registrationNo: string;
  checkIn: Date;
  task: string;
  durationMinutes: number;
}

export interface AttendanceSummaryDTO {
  totalMembers: number;
  activeNow: number;
  checkedInToday: number;
  completedToday: number;
  totalMinutesToday: number;
}

export interface DailyStatDTO {
  date: string;
  sessions: number;
  members: number;
  totalMinutes: number;
  averageMinutes: number;
}

export interface MemberStatDTO {
  userId: string;
  name: string;
  registrationNo: string;
  sessions: number;
  totalMinutes: number;
  averageMinutes: number;
}

/**
 * Transforms an AttendanceSession document into a clean DTO.
 */
export function formatSessionDTO(
  session: AttendanceSessionDocument
): AttendanceSessionDTO {
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
    durationMinutes: session.durationMinutes,
    status: session.status,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

/**
 * Queries paginated attendance sessions with filters.
 */
export async function getAttendanceSessions(filters: {
  page?: number;
  limit?: number;
  userId?: string;
  registrationNo?: string;
  status?: 'ACTIVE' | 'COMPLETED';
  startDate?: string;
  endDate?: string;
}): Promise<{ data: AttendanceSessionDTO[]; pagination: PaginationInfo }> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const query: FilterQuery<any> = {};

  if (filters.userId) {
    if (mongoose.Types.ObjectId.isValid(filters.userId)) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    } else {
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
    if (startDate) query.checkIn.$gte = startDate;
    if (endDate) query.checkIn.$lt = endDate;
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
export async function getSessionById(id: string): Promise<AttendanceSessionDTO> {
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
export async function getActiveMembers(): Promise<ActiveMemberDTO[]> {
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
      durationMinutes,
    };
  });
}

/**
 * Returns all attendance sessions for the current day in IST.
 */
export async function getTodayAttendance(): Promise<AttendanceSessionDTO[]> {
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
export async function getAttendanceSummary(): Promise<AttendanceSummaryDTO> {
  const { startOfToday, startOfTomorrow } = getTodayRange();

  const [
    totalMembers,
    activeNow,
    checkedInTodayUsers,
    completedToday,
    minutesAggregate,
  ] = await Promise.all([
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

  const totalMinutesToday =
    minutesAggregate.length > 0 && minutesAggregate[0]?.totalMinutes
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
export async function getDailyStats(
  startDateStr?: string,
  endDateStr?: string
): Promise<DailyStatDTO[]> {
  const match: FilterQuery<any> = {};
  const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
  if (startDate || endDate) {
    match.checkIn = {};
    if (startDate) match.checkIn.$gte = startDate;
    if (endDate) match.checkIn.$lt = endDate;
  }

  const pipeline: any[] = [
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
export async function getMemberStats(
  startDateStr?: string,
  endDateStr?: string
): Promise<MemberStatDTO[]> {
  const match: FilterQuery<any> = {};
  const { startDate, endDate } = parseDateRange(startDateStr, endDateStr);
  if (startDate || endDate) {
    match.checkIn = {};
    if (startDate) match.checkIn.$gte = startDate;
    if (endDate) match.checkIn.$lt = endDate;
  }

  const pipeline: any[] = [
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
export async function getAttendanceEvents(filters: {
  page?: number;
  limit?: number;
  userId?: string;
  type?: 'CHECK_IN' | 'CHECK_OUT';
  startDate?: string;
  endDate?: string;
}): Promise<{ data: AttendanceEventDTO[]; pagination: PaginationInfo }> {
  const page = Math.max(1, filters.page || 1);
  const limit = Math.min(100, Math.max(1, filters.limit || 20));
  const skip = (page - 1) * limit;

  const query: FilterQuery<any> = {};

  if (filters.userId) {
    if (mongoose.Types.ObjectId.isValid(filters.userId)) {
      query.userId = new mongoose.Types.ObjectId(filters.userId);
    } else {
      query.userId = filters.userId;
    }
  }

  if (filters.type) {
    query.type = filters.type;
  }

  const { startDate, endDate } = parseDateRange(filters.startDate, filters.endDate);
  if (startDate || endDate) {
    query.timestamp = {};
    if (startDate) query.timestamp.$gte = startDate;
    if (endDate) query.timestamp.$lt = endDate;
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
