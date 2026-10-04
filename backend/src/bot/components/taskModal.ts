import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

export const MODAL_CUSTOM_ID = 'attendance_task_modal';
export const TASK_INPUT_CUSTOM_ID = 'attendance_task_input';
export const ENTER_TASK_BUTTON_ID = 'attendance_checkin_task';
export const SKIP_TASK_BUTTON_ID = 'attendance_checkin_skip';
// Legacy aliases for backward compatibility
export const LEGACY_ENTER_TASK_BUTTON_ID = 'attendance_enter_task';
export const LEGACY_SKIP_TASK_BUTTON_ID = 'attendance_skip_task';

/**
 * Builds the modal dialog allowing a team member to optionally enter their task description.
 */
export function buildTaskModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(MODAL_CUSTOM_ID)
    .setTitle('CHECK IN');

  const taskInput = new TextInputBuilder()
    .setCustomId(TASK_INPUT_CUSTOM_ID)
    .setLabel('What are you working on?')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('e.g. Working on SIH backend implementation')
    .setRequired(false)
    .setMaxLength(500);

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(taskInput);
  modal.addComponents(row);

  return modal;
}

/**
 * Builds the ActionRow containing the [Enter Task] and [Skip] buttons for check-in prompt.
 */
export function buildCheckInPromptButtons(): ActionRowBuilder<ButtonBuilder> {
  const enterTaskBtn = new ButtonBuilder()
    .setCustomId(ENTER_TASK_BUTTON_ID)
    .setLabel('Enter Task')
    .setStyle(ButtonStyle.Success);

  const skipBtn = new ButtonBuilder()
    .setCustomId(SKIP_TASK_BUTTON_ID)
    .setLabel('Skip')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder<ButtonBuilder>().addComponents(enterTaskBtn, skipBtn);
}
