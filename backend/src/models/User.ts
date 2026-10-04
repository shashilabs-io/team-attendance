import { Schema, model, Document, Model } from 'mongoose';
import { UserRole, USER_ROLES } from '../types/attendance.js';

export interface IUser {
  name: string;
  registrationNo: string;
  discordUserId: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = Document & IUser;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
    },
    registrationNo: {
      type: String,
      required: [true, 'Registration number is required'],
      trim: true,
      unique: true,
    },
    discordUserId: {
      type: String,
      required: [true, 'Discord user ID is required'],
      trim: true,
      unique: true,
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: '{VALUE} is not a valid user role',
      },
      default: 'MEMBER',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

export const User: Model<IUser> = model<IUser>('User', userSchema);
