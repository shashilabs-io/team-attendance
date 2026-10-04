import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { AttendanceSession } from '../models/AttendanceSession.js';
import { AppError } from '../utils/AppError.js';
/**
 * Transforms a User document into a clean DTO without internal fields.
 */
export function formatUserDTO(user) {
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
export async function getUserByDiscordId(discordUserId) {
    return User.findOne({ discordUserId }).exec();
}
/**
 * Finds a user by their registration number.
 */
export async function getUserByRegistrationNo(registrationNo) {
    return User.findOne({ registrationNo: registrationNo.trim() }).exec();
}
/**
 * Finds an active team member by their Discord user ID.
 * Throws AppError if the user is not found or inactive.
 */
export async function getActiveTeamMemberByDiscordId(discordUserId) {
    const user = await getUserByDiscordId(discordUserId);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', 'You are not registered as a team member.');
    }
    if (!user.isActive) {
        throw new AppError('USER_INACTIVE', 'Your account is inactive.');
    }
    return user;
}
/**
 * Finds an active team member by their registration number.
 * Throws AppError if the user is not found or inactive.
 */
export async function getActiveTeamMemberByRegistrationNo(registrationNo) {
    const user = await getUserByRegistrationNo(registrationNo);
    if (!user) {
        throw new AppError('USER_NOT_FOUND', `No registered team member found with registration number: ${registrationNo.trim()}`);
    }
    if (!user.isActive) {
        throw new AppError('USER_INACTIVE', `Account for registration number ${registrationNo.trim()} is currently inactive.`);
    }
    return user;
}
/**
 * Returns all registered users sorted by registration number.
 */
export async function getAllUsers() {
    const users = await User.find({}).sort({ registrationNo: 1 }).exec();
    return users.map(formatUserDTO);
}
/**
 * Returns a single user by MongoDB _id.
 */
export async function getUserById(id) {
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
export async function getUserStatus(id) {
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
