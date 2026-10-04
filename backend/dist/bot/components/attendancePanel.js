import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, } from 'discord.js';
export const PANEL_CHECK_IN_BUTTON_ID = 'attendance_panel_checkin';
export const PANEL_CHECK_OUT_BUTTON_ID = 'attendance_panel_checkout';
// Legacy aliases for backward compatibility
export const LEGACY_PANEL_CHECK_IN_BUTTON_ID = 'attendance_panel_check_in';
export const LEGACY_PANEL_CHECK_OUT_BUTTON_ID = 'attendance_panel_check_out';
/**
 * Builds the standard attendance panel Embed and ActionRow components.
 */
export function buildAttendancePanel() {
    const embed = new EmbedBuilder()
        .setTitle('📋 TEAM ATTENDANCE')
        .setDescription('Welcome to the Team Attendance System.\n\n' +
        '• Click **🟢 CHECK IN** when you start working.\n' +
        '• Click **🔴 CHECK OUT** when you conclude your session.\n\n' +
        '_You can also use plain text commands `ci` / `co` or slash commands `/ci` / `/co` in chat._')
        .setColor(0x5865f2)
        .setFooter({ text: 'Team Attendance System • MongoDB Source of Truth' })
        .setTimestamp();
    const checkInBtn = new ButtonBuilder()
        .setCustomId(PANEL_CHECK_IN_BUTTON_ID)
        .setLabel('CHECK IN')
        .setEmoji('🟢')
        .setStyle(ButtonStyle.Success);
    const checkOutBtn = new ButtonBuilder()
        .setCustomId(PANEL_CHECK_OUT_BUTTON_ID)
        .setLabel('CHECK OUT')
        .setEmoji('🔴')
        .setStyle(ButtonStyle.Danger);
    const row = new ActionRowBuilder().addComponents(checkInBtn, checkOutBtn);
    return { embeds: [embed], components: [row] };
}
/**
 * Deploys or updates the persistent attendance panel in the configured channel without spamming.
 */
export async function ensureAttendancePanel(client, channelId) {
    if (!channelId) {
        console.warn('⚠️ ATTENDANCE_CHANNEL_ID is not configured. Attendance panel was not deployed.');
        return;
    }
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || channel.type !== ChannelType.GuildText) {
            console.error(`❌ Invalid attendance channel (ID: ${channelId}). Must be a valid text channel.`);
            return;
        }
        const textChannel = channel;
        const panelPayload = buildAttendancePanel();
        // Fetch recent messages to locate an existing panel posted by this bot
        const messages = await textChannel.messages.fetch({ limit: 10 });
        const existingPanel = messages.find((msg) => msg.author.id === client.user?.id &&
            msg.embeds.some((embed) => embed.title === '📋 TEAM ATTENDANCE'));
        if (existingPanel) {
            await existingPanel.edit(panelPayload);
            console.log('🔄 Updated existing attendance panel in channel.');
        }
        else {
            await textChannel.send(panelPayload);
            console.log('📢 Created new attendance panel in channel.');
        }
    }
    catch (error) {
        console.error('❌ Failed to ensure attendance panel:', error);
    }
}
