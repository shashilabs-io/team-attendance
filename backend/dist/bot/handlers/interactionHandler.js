import { MessageFlags, } from 'discord.js';
import { prepareCheckInPrompt, executeCheckIn, } from '../commands/checkIn.js';
import { executeCheckOut } from '../commands/checkOut.js';
import { buildTaskModal, ENTER_TASK_BUTTON_ID, SKIP_TASK_BUTTON_ID, LEGACY_ENTER_TASK_BUTTON_ID, LEGACY_SKIP_TASK_BUTTON_ID, MODAL_CUSTOM_ID, TASK_INPUT_CUSTOM_ID, } from '../components/taskModal.js';
import { PANEL_CHECK_IN_BUTTON_ID, PANEL_CHECK_OUT_BUTTON_ID, LEGACY_PANEL_CHECK_IN_BUTTON_ID, LEGACY_PANEL_CHECK_OUT_BUTTON_ID, } from '../components/attendancePanel.js';
import { AppError } from '../../utils/AppError.js';
/**
 * Dispatches and safely handles all Discord interactions (slash commands, buttons, modals).
 */
export async function handleInteraction(interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
            return;
        }
        if (interaction.isButton()) {
            await handleButton(interaction);
            return;
        }
        if (interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
            return;
        }
    }
    catch (error) {
        await handleInteractionError(interaction, error);
    }
}
/**
 * Handles slash commands: /ci and /co
 */
async function handleSlashCommand(interaction) {
    const { commandName } = interaction;
    if (commandName === 'ci') {
        const payload = await prepareCheckInPrompt(interaction.user.id);
        await interaction.reply({
            content: payload.content,
            components: payload.components,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    if (commandName === 'co') {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = await executeCheckOut(interaction.user.id);
        await interaction.editReply(reply);
        return;
    }
}
/**
 * Handles button interactions: Enter Task, Skip, and Panel Buttons
 */
async function handleButton(interaction) {
    const { customId } = interaction;
    // 1. Enter Task button clicked -> show modal
    if (customId === ENTER_TASK_BUTTON_ID || customId === LEGACY_ENTER_TASK_BUTTON_ID) {
        const modal = buildTaskModal();
        await interaction.showModal(modal);
        return;
    }
    // 2. Skip button clicked -> immediately check in with "Not specified"
    if (customId === SKIP_TASK_BUTTON_ID || customId === LEGACY_SKIP_TASK_BUTTON_ID) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = await executeCheckIn(interaction.user.id, 'Not specified');
        await interaction.editReply(reply);
        return;
    }
    // 3. Panel Check In button -> show check-in prompt
    if (customId === PANEL_CHECK_IN_BUTTON_ID || customId === LEGACY_PANEL_CHECK_IN_BUTTON_ID) {
        const payload = await prepareCheckInPrompt(interaction.user.id);
        await interaction.reply({
            content: payload.content,
            components: payload.components,
            flags: MessageFlags.Ephemeral,
        });
        return;
    }
    // 4. Panel Check Out button -> immediately check out
    if (customId === PANEL_CHECK_OUT_BUTTON_ID || customId === LEGACY_PANEL_CHECK_OUT_BUTTON_ID) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const reply = await executeCheckOut(interaction.user.id);
        await interaction.editReply(reply);
        return;
    }
}
/**
 * Handles task modal submission
 */
async function handleModalSubmit(interaction) {
    if (interaction.customId === MODAL_CUSTOM_ID) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const rawTask = interaction.fields.getTextInputValue(TASK_INPUT_CUSTOM_ID);
        const task = rawTask?.trim() || 'Not specified';
        const reply = await executeCheckIn(interaction.user.id, task);
        await interaction.editReply(reply);
    }
}
/**
 * Formats and sends user-friendly error messages, preventing bot crashes.
 */
async function handleInteractionError(interaction, error) {
    let message = '❌ Something went wrong while recording attendance. Please try again.';
    if (error instanceof AppError) {
        if (error.code === 'USER_NOT_FOUND') {
            message = '❌ You are not registered as a team member.';
        }
        else if (error.code === 'USER_INACTIVE') {
            message = '❌ Your account is inactive.';
        }
        else if (error.code === 'ALREADY_CHECKED_IN') {
            message = '❌ You are already checked in.';
        }
        else if (error.code === 'NO_CHECK_IN') {
            message = "❌ You don't have an active check-in.";
        }
        else {
            message = `❌ ${error.message}`;
        }
    }
    else {
        console.error('Unhandled interaction error:', error);
    }
    if (interaction.isChatInputCommand() ||
        interaction.isButton() ||
        interaction.isModalSubmit()) {
        if (interaction.deferred) {
            await interaction.editReply({ content: message });
        }
        else if (!interaction.replied) {
            await interaction.reply({
                content: message,
                flags: MessageFlags.Ephemeral,
            });
        }
    }
}
