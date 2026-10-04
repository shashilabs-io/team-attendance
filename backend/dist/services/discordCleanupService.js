import { ChannelType, } from 'discord.js';
export const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
export const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour
let cleanupInterval = null;
let initialCleanupTimeout = null;
/**
 * Checks whether a message is the persistent attendance panel that must never be deleted.
 */
export function isPermanentAttendancePanel(message, botUserId) {
    if (message.author.id !== botUserId) {
        return false;
    }
    // Check for the permanent title in embeds
    const hasPanelEmbed = message.embeds.some((embed) => embed.title === '📋 TEAM ATTENDANCE');
    if (hasPanelEmbed) {
        return true;
    }
    // Check for persistent panel button IDs in components
    const hasPanelButton = message.components.some((row) => row.components?.some((comp) => comp.customId === 'attendance_panel_checkin' ||
        comp.customId === 'attendance_panel_checkout' ||
        comp.customId === 'attendance_panel_check_in' ||
        comp.customId === 'attendance_panel_check_out'));
    return hasPanelButton;
}
/**
 * Scans the attendance channel and deletes bot messages older than 24 hours.
 * Excludes user messages, third-party bot messages, and the permanent attendance panel.
 */
export async function cleanupOldAttendanceMessages(client, channelId) {
    if (!channelId) {
        return 0;
    }
    if (!client.channels) {
        return 0;
    }
    const botUser = client.user;
    if (!botUser) {
        return 0;
    }
    console.log('🧹 Cleaning Discord messages older than 24 hours...');
    let deletedCount = 0;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            console.warn(`⚠️ Cleanup skipped: Channel ${channelId} is not a valid text channel.`);
            return 0;
        }
        const textChannel = channel;
        const now = Date.now();
        const cutoffTimestamp = now - TWENTY_FOUR_HOURS_MS;
        const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000;
        // Fetch up to 100 messages from the attendance channel
        const messages = await textChannel.messages.fetch({
            limit: 100,
        });
        // Filter to ONLY bot-authored messages older than 24h, excluding the permanent panel
        const eligibleMessages = messages.filter((msg) => {
            // 1. Must be sent by our attendance bot
            if (msg.author.id !== botUser.id) {
                return false;
            }
            // 2. Must NOT be the permanent attendance panel
            if (isPermanentAttendancePanel(msg, botUser.id)) {
                return false;
            }
            // 3. Must be older than 24 hours
            return msg.createdTimestamp <= cutoffTimestamp;
        });
        if (eligibleMessages.size === 0) {
            console.log('✅ Discord message cleanup complete (0 old messages to delete).');
            return 0;
        }
        // Split into messages eligible for bulk delete (<14 days old) vs older (>=14 days old)
        const bulkDeletable = eligibleMessages.filter((msg) => msg.createdTimestamp > fourteenDaysAgo);
        const olderMessages = eligibleMessages.filter((msg) => msg.createdTimestamp <= fourteenDaysAgo);
        // Delete in bulk (<14 days old)
        if (bulkDeletable.size > 0) {
            if (bulkDeletable.size === 1) {
                await bulkDeletable.first()?.delete();
            }
            else {
                const deleted = await textChannel.bulkDelete(bulkDeletable, true);
                deletedCount += deleted.size;
            }
        }
        // Delete older messages sequentially (>14 days old cannot be bulk deleted by Discord API)
        for (const [, msg] of olderMessages) {
            try {
                await msg.delete();
                deletedCount++;
                // Small delay to respect rate limits
                await new Promise((res) => setTimeout(res, 250));
            }
            catch (err) {
                console.error(`Failed to delete message ${msg.id}:`, err);
            }
        }
        console.log('✅ Discord message cleanup complete');
        if (deletedCount > 0) {
            console.log(`🗑️ Deleted ${deletedCount} old attendance messages.`);
        }
        return deletedCount;
    }
    catch (error) {
        console.error('Discord cleanup failed:', error);
        return deletedCount;
    }
}
/**
 * Initializes the automated hourly cleanup scheduler.
 * Enforces a single active timer per process to ensure restart safety.
 */
export function startDiscordCleanupScheduler(client, channelId) {
    if (!channelId) {
        console.warn('⚠️ ATTENDANCE_CHANNEL_ID not set. Automatic cleanup scheduler not started.');
        return;
    }
    // Clear any existing timers to prevent duplicates on restart
    stopDiscordCleanupScheduler();
    console.log('🧹 Discord message cleanup enabled');
    console.log('⏰ Old messages will be deleted after 24 hours');
    // Run initial cleanup check shortly after startup (10 seconds delay)
    initialCleanupTimeout = setTimeout(() => {
        cleanupOldAttendanceMessages(client, channelId).catch((err) => {
            console.error('Discord cleanup failed:', err);
        });
    }, 10000);
    initialCleanupTimeout.unref?.();
    // Schedule recurring hourly cleanup
    cleanupInterval = setInterval(() => {
        cleanupOldAttendanceMessages(client, channelId).catch((err) => {
            console.error('Discord cleanup failed:', err);
        });
    }, CLEANUP_INTERVAL_MS);
    // Prevent interval from holding process open if terminated
    cleanupInterval.unref?.();
}
/**
 * Stops the cleanup scheduler (useful for testing and graceful shutdown).
 */
export function stopDiscordCleanupScheduler() {
    if (cleanupInterval) {
        clearInterval(cleanupInterval);
        cleanupInterval = null;
    }
    if (initialCleanupTimeout) {
        clearTimeout(initialCleanupTimeout);
        initialCleanupTimeout = null;
    }
}
