import mongoose from 'mongoose';
import { User, UserDocument } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AppError } from '../utils/AppError.js';

export interface UserResponseDTO {
  id: string;
  name: string;
  registrationNo: string;
  discordUserId: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStatusDTO {
  user: {
    id: string;
    name: string;
    registrationNo: string;
  };
  status: 'ACTIVE' | 'OFFLINE';
  session: {
    id: string;
    checkIn: Date;
    task?: string;
  } | null;
}

/**
 * Transforms a User document into a clean DTO without internal fields.
 */
export function formatUserDTO(user: UserDocument): UserResponseDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    registrationNo: user.registrationNo,
    discordUserId: user.discordUserId,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Finds a user by their Discord user ID.
 */
export async function getUserByDiscordId(
  discordUserId: string
): Promise<UserDocument | null> {
  return User.findOne({ discordUserId }).exec();
}

/**
 * Finds an active team member by their Discord user ID.
 * Throws AppError if the user is not found or inactive.
 */
export async function getActiveTeamMemberByDiscordId(
  discordUserId: string
): Promise<UserDocument> {
  const user = await getUserByDiscordId(discordUserId);

  if (!user) {
    throw new AppError(
      'USER_NOT_FOUND',
      'You are not registered as a team member.'
    );
  }

  if (!user.isActive) {
    throw new AppError('USER_INACTIVE', 'Your account is inactive.');
  }

  return user;
}

/**
 * Returns all registered users sorted by registration number.
 */
export async function getAllUsers(): Promise<UserResponseDTO[]> {
  const users = await User.find({}).sort({ registrationNo: 1 }).exec();
  return users.map(formatUserDTO);
}

/**
 * Returns a single user by MongoDB _id.
 */
export async function getUserById(id: string): Promise<UserResponseDTO> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('USER_NOT_FOUND', 'User not found');
  }

  const user = await User.findById(id).exec();
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found');
  }

  return formatUserDTO(user);
}

/**
 * Returns current attendance status for a user by id.
 */
export async function getUserStatus(id: string): Promise<UserStatusDTO> {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('USER_NOT_FOUND', 'User not found');
  }

  const user = await User.findById(id).exec();
  if (!user) {
    throw new AppError('USER_NOT_FOUND', 'User not found');
  }

  const activeSession = await AttendanceSession.findOne({
    userId: user._id,
    status: 'ACTIVE',
  }).exec();

  return {
    user: {
      id: user._id.toString(),
      name: user.name,
      registrationNo: user.registrationNo,
    },
    status: activeSession ? 'ACTIVE' : 'OFFLINE',
    session: activeSession
      ? {
          id: activeSession._id.toString(),
          checkIn: activeSession.checkIn,
          task: activeSession.task,
        }
      : null,
  };
}
