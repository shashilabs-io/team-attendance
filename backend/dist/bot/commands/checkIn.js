import { getActiveTeamMemberByDiscordId } from '../../services/userService.js';
import { checkInUser, getActiveSession } from '../../services/attendanceService.js';
import { buildCheckInPromptButtons } from '../components/taskModal.js';
import { AppError } from '../../utils/AppError.js';
/**
 * Validates team member and prepares the check-in prompt with [Enter Task] and [Skip] buttons.
 */
export async function prepareCheckInPrompt(discordUserId) {
    // Validate team member
    await getActiveTeamMemberByDiscordId(discordUserId);
    // Check if already active
    const activeSession = await getActiveSession(discordUserId);
    if (activeSession) {
        throw new AppError('ALREADY_CHECKED_IN', 'You are already checked in.');
    }
    return {
        content: '🟢 **CHECK IN**\n\nWhat are you working on?',
        components: [buildCheckInPromptButtons()],
    };
}
/**
 * Completes the check-in process and formats the success message.
 */
export async function executeCheckIn(discordUserId, task) {
    const session = await checkInUser({ discordUserId, task });
    const unixTimestamp = Math.floor(session.checkIn.getTime() / 1000);
    return (`🟢 **CHECKED IN**\n\n` +
        `**Member:** ${session.name}\n` +
        `**Task:** ${session.task || 'Not specified'}\n` +
        `**Time:** <t:${unixTimestamp}:T> (<t:${unixTimestamp}:R>)`);
}
