import { discordClient } from './client.js';
import { env } from '../config/env.js';
import { handleMessage } from './handlers/messageHandler.js';
import { handleInteraction } from './handlers/interactionHandler.js';
import { registerGuildSlashCommands } from './commands/register.js';
import { ensureAttendancePanel } from './components/attendancePanel.js';
import { startDiscordCleanupScheduler } from '../services/discordCleanupService.js';
/**
 * Initializes and starts the Discord bot client, registering listeners and slash commands.
 */
export async function startDiscordBot() {
    if (!env.DISCORD_TOKEN || !env.DISCORD_TOKEN.trim()) {
        console.warn('⚠️ Discord bot startup skipped: DISCORD_TOKEN is not configured in backend/.env');
        return;
    }
    console.log('🤖 Discord bot starting...');
    // Register listeners
    discordClient.on('messageCreate', handleMessage);
    discordClient.on('interactionCreate', handleInteraction);
    // Ready handler
    discordClient.once('clientReady', async (readyClient) => {
        console.log(`✅ Discord bot online as ${readyClient.user.tag}`);
        // Register slash commands if guild ID is provided
        if (env.DISCORD_GUILD_ID && env.DISCORD_TOKEN) {
            await registerGuildSlashCommands(env.DISCORD_TOKEN, readyClient.user.id, env.DISCORD_GUILD_ID);
        }
        else {
            console.warn('⚠️ DISCORD_GUILD_ID not set in backend/.env. Guild slash commands (/ci, /co) not registered.');
        }
        // Deploy or refresh persistent attendance panel
        if (env.ATTENDANCE_CHANNEL_ID) {
            await ensureAttendancePanel(readyClient, env.ATTENDANCE_CHANNEL_ID);
            // Start 24-hour message cleanup scheduler
            startDiscordCleanupScheduler(readyClient, env.ATTENDANCE_CHANNEL_ID);
        }
    });
    try {
        await discordClient.login(env.DISCORD_TOKEN);
    }
    catch (error) {
        console.error('❌ Failed to login to Discord:', error);
    }
}
