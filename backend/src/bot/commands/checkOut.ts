import { checkOutUser } from '../../services/attendanceService.js';
import { formatDuration } from '../../utils/duration.js';

/**
 * Checks out the team member and formats the response message.
 */
export async function executeCheckOut(
  discordUserId: string,
  task?: string
): Promise<string> {
  const { session, durationMinutes } = await checkOutUser({
    discordUserId,
    task,
  });

  const durationStr = formatDuration(durationMinutes);

  return (
    `🔴 **CHECKED OUT**\n\n` +
    `**Member:** ${session.name}\n` +
    `**Task:** ${session.task || 'Not specified'}\n` +
    `**Duration:** ${durationStr}\n\n` +
    `✅ Attendance recorded.`
  );
}
