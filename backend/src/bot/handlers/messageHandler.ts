import { Message } from 'discord.js';
import { prepareCheckInPrompt } from '../commands/checkIn.js';
import { executeCheckOut } from '../commands/checkOut.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Handles incoming plain-text chat commands (exact 'ci' and 'co').
 */
export async function handleMessage(message: Message): Promise<void> {
  // Ignore messages from any bot, including self
  if (message.author.bot) {
    return;
  }

  const normalized = message.content.trim().toLowerCase();

  // Only handle exact matches for 'ci' and 'co'
  if (normalized !== 'ci' && normalized !== 'co') {
    return;
  }

  try {
    if (normalized === 'ci') {
      const payload = await prepareCheckInPrompt(message.author.id);
      await message.reply(payload);
      return;
    }

    if (normalized === 'co') {
      const reply = await executeCheckOut(message.author.id);
      await message.reply(reply);
      return;
    }
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.code === 'USER_NOT_FOUND') {
        await message.reply('❌ You are not registered as a team member.');
        return;
      }
      if (error.code === 'USER_INACTIVE') {
        await message.reply('❌ Your account is inactive.');
        return;
      }
      if (error.code === 'ALREADY_CHECKED_IN') {
        await message.reply('❌ You are already checked in.');
        return;
      }
      if (error.code === 'NO_CHECK_IN') {
        await message.reply("❌ You don't have an active check-in.");
        return;
      }
      await message.reply(`❌ ${error.message}`);
      return;
    }

    console.error('Unhandled error in handleMessage:', error);
    await message.reply('❌ Something went wrong while recording attendance. Please try again.');
  }
}
