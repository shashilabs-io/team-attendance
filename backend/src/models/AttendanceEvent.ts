import { Schema, model, Document, Model, Types } from 'mongoose';
import {
  AttendanceEventType,
  ATTENDANCE_EVENT_TYPES,
} from '../types/attendance.js';

export interface IAttendanceEvent {
  eventId: string;
  userId: Types.ObjectId;
  discordUserId: string;
  registrationNo: string;
  type: AttendanceEventType;
  sessionId: Types.ObjectId;
  timestamp: Date;
  task?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export type AttendanceEventDocument = Document & IAttendanceEvent;

const attendanceEventSchema = new Schema<IAttendanceEvent>(
  {
    eventId: {
      type: String,
      required: [true, 'Event ID is required'],
      unique: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true,
    },
    discordUserId: {
      type: String,
      required: [true, 'Discord user ID is required'],
      index: true,
      trim: true,
    },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ATTENDANCE_EVENT_TYPES,
        message: '{VALUE} is not a valid attendance event type',
      },
      index: true,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'AttendanceSession',
      required: [true, 'Session ID reference is required'],
      index: true,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      index: true,
    },
    task: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Immutable audit log
    collection: 'attendance_events',
  }
);

// Compound and query indexes
attendanceEventSchema.index({ userId: 1, timestamp: -1 });
attendanceEventSchema.index({ discordUserId: 1, timestamp: -1 });

export const AttendanceEvent: Model<IAttendanceEvent> = model<IAttendanceEvent>(
  'AttendanceEvent',
  attendanceEventSchema
);
