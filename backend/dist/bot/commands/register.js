import { REST, Routes, SlashCommandBuilder } from 'discord.js';
export const slashCommands = [
    new SlashCommandBuilder()
        .setName('ci')
        .setDescription('Check in to work'),
    new SlashCommandBuilder()
        .setName('co')
        .setDescription('Check out from work'),
].map((cmd) => cmd.toJSON());
/**
 * Registers guild-specific slash commands for rapid development updates.
 */
export async function registerGuildSlashCommands(token, clientId, guildId) {
    try {
        const rest = new REST({ version: '10' }).setToken(token);
        console.log(`📝 Registering slash commands (/ci, /co) for guild: ${guildId}...`);
        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: slashCommands,
        });
        console.log('✅ Guild slash commands registered successfully.');
    }
    catch (error) {
        console.error('❌ Failed to register guild slash commands:', error);
    }
}
