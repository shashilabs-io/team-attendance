import { Schema, model, Document, Model, Types } from 'mongoose';
import {
  AttendanceSessionStatus,
  ATTENDANCE_SESSION_STATUSES,
} from '../types/attendance.js';

export interface IAttendanceSession {
  userId: Types.ObjectId;
  discordUserId: string;
  name: string;
  registrationNo: string;
  checkIn: Date;
  checkOut?: Date;
  task?: string;
  remarks?: string;
  durationMinutes?: number;
  status: AttendanceSessionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceSessionDocument = Document & IAttendanceSession;

const attendanceSessionSchema = new Schema<IAttendanceSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID reference is required'],
      index: true,
    },
    discordUserId: {
      type: String,
      required: [true, 'Discord user ID is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      index: true,
    },
    checkIn: {
      type: Date,
      required: [true, 'Check-in time is required'],
      index: true,
    },
    checkOut: {
      type: Date,
      validate: [
        {
          validator: function (this: IAttendanceSession, val?: Date): boolean {
            if (this.status === 'COMPLETED') {
              return val instanceof Date && !isNaN(val.getTime());
            }
            return true;
          },
          message: 'A completed session must have a checkOut timestamp',
        },
        {
          validator: function (this: IAttendanceSession, val?: Date): boolean {
            if (this.status === 'ACTIVE') {
              return val === undefined || val === null;
            }
            return true;
          },
          message: 'An active session must not have a checkOut timestamp',
        },
        {
          validator: function (this: IAttendanceSession, val?: Date): boolean {
            if (val && this.checkIn) {
              return val.getTime() >= this.checkIn.getTime();
            }
            return true;
          },
          message: 'checkOut must not be earlier than checkIn',
        },
      ],
    },
    task: {
      type: String,
      trim: true,
      maxlength: [500, 'Task description cannot exceed 500 characters'],
    },
    remarks: {
      type: String,
      trim: true,
      maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
    },
    durationMinutes: {
      type: Number,
      min: [0, 'Duration minutes cannot be negative'],
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ATTENDANCE_SESSION_STATUSES,
        message: '{VALUE} is not a valid attendance session status',
      },
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'attendance_sessions',
  }
);

// Enforce at most one ACTIVE session per team member at the database level
attendanceSessionSchema.index(
  { discordUserId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' },
    name: 'unique_active_session_per_discord_user',
  }
);

// Query and compound indexes
attendanceSessionSchema.index({ userId: 1, checkIn: -1 });
attendanceSessionSchema.index({ discordUserId: 1, checkIn: -1 });
attendanceSessionSchema.index({ registrationNo: 1, checkIn: -1 });
attendanceSessionSchema.index({ checkIn: -1 });

export const AttendanceSession: Model<IAttendanceSession> =
  model<IAttendanceSession>('AttendanceSession', attendanceSessionSchema);
