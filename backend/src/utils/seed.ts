import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/User.js';

interface SeedMember {
  name: string;
  registrationNo: string;
}

const initialMembers: SeedMember[] = [
  {
    name: 'Rana Pratap Mishra',
    registrationNo: '24105110072',
  },
  {
    name: 'Satyam Kumar Pandey',
    registrationNo: '24105110030',
  },
  {
    name: 'Sejal Singh',
    registrationNo: '24105110043',
  },
  {
    name: 'Shashi Bhushan',
    registrationNo: '24105110087',
  },
];

export async function seedDevelopmentTeam(): Promise<void> {
  try {
    console.log('🌱 Connecting to database for seeding...');
    await connectDatabase();

    console.log(`🌱 Seeding ${initialMembers.length} team members...`);

    for (const member of initialMembers) {
      const updatedUser = await User.findOneAndUpdate(
        { registrationNo: member.registrationNo },
        {
          $set: {
            name: member.name,
            role: 'MEMBER',
            isActive: true,
          },
          $setOnInsert: {
            registrationNo: member.registrationNo,
            discordUserId: `REPLACE_WITH_DISCORD_ID_${member.registrationNo}`,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(
        `   ✔ [${updatedUser.registrationNo}] ${updatedUser.name} (Role: ${updatedUser.role}, DiscordId: ${updatedUser.discordUserId})`
      );
    }

    console.log('✅ Team members seeded successfully (idempotent).\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database disconnected.');
  }
}

// Execute directly if run as a script
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedDevelopmentTeam();
}
