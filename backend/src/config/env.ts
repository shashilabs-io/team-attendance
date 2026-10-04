import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z
    .string({
      required_error: 'MONGODB_URI is required. Please set it in backend/.env',
    })
    .min(1, 'MONGODB_URI cannot be empty')
    .refine(
      (uri) => !uri.includes('YOUR_USERNAME') && !uri.includes('YOUR_PASSWORD') && !uri.includes('YOUR_CLUSTER'),
      {
        message: 'MONGODB_URI contains placeholder values. Please put your actual MongoDB Atlas connection string into backend/.env',
      }
    )
    .refine(
      (uri) => uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'),
      {
        message: 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://"',
      }
    ),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DISCORD_TOKEN: z.string().optional(),
  DISCORD_GUILD_ID: z.string().optional(),
  ATTENDANCE_CHANNEL_ID: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('\n❌ Environment configuration error:');
    result.error.issues.forEach((issue) => {
      console.error(`   • ${issue.path.join('.')}: ${issue.message}`);
    });
    console.error('\n👉 Please configure your MongoDB Atlas connection string in backend/.env (refer to backend/.env.example)\n');
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
