import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { createToken, hashPassword, verifyPassword } from '../utils/token.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

/**
 * POST /api/auth/login
 * Authenticates a team member using their registration number and optional password/PIN.
 */
export async function loginHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { registrationNo, password } = req.body;

    if (!registrationNo || typeof registrationNo !== 'string') {
      throw new AppError('VALIDATION_ERROR', 'Registration number is required.');
    }

    const cleanRegNo = registrationNo.trim();

    // Query user including password field for verification
    const user = await User.findOne({ registrationNo: cleanRegNo })
      .select('+password')
      .exec();

    if (!user) {
      throw new AppError(
        'USER_NOT_FOUND',
        `No registered team member found for registration number: ${cleanRegNo}`
      );
    }

    if (!user.isActive) {
      throw new AppError(
        'USER_INACTIVE',
        `Account for registration number ${cleanRegNo} is currently inactive.`
      );
    }

    // Password validation logic
    if (user.password) {
      if (!password || !verifyPassword(password, user.password)) {
        throw new AppError('UNAUTHORIZED', 'Incorrect password. Please try again.');
      }
    } else if (password && password.trim().length >= 4) {
      // First-time setup: user set a password upon login
      user.password = hashPassword(password.trim());
      await user.save();
    }

    const token = createToken({
      id: user._id.toString(),
      name: user.name,
      registrationNo: user.registrationNo,
      role: user.role,
      discordUserId: user.discordUserId,
    });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.name}!`,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          registrationNo: user.registrationNo,
          role: user.role,
          discordUserId: user.discordUserId,
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/me
 * Retrieves current authenticated user details from token.
 */
export async function getMeHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as any).user;
    const user = await User.findById(authUser.id).exec();

    if (!user || !user.isActive) {
      throw new AppError('USER_NOT_FOUND', 'User session is no longer active.');
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id.toString(),
        name: user.name,
        registrationNo: user.registrationNo,
        role: user.role,
        discordUserId: user.discordUserId,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/password
 * Sets or updates password for the authenticated user.
 */
export async function updatePasswordHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authUser = (req as any).user;
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 4) {
      throw new AppError('VALIDATION_ERROR', 'New password must be at least 4 characters long.');
    }

    const user = await User.findById(authUser.id).select('+password').exec();
    if (!user) {
      throw new AppError('USER_NOT_FOUND', 'User not found.');
    }

    if (user.password && (!currentPassword || !verifyPassword(currentPassword, user.password))) {
      throw new AppError('UNAUTHORIZED', 'Current password is incorrect.');
    }

    user.password = hashPassword(newPassword.trim());
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Builds the Discord OAuth2 authorization URL.
 */
function buildDiscordAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    response_type: 'code',
    redirect_uri: env.DISCORD_REDIRECT_URI,
    scope: 'identify',
    prompt: 'consent',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

/**
 * GET /api/auth/discord/url
 * Returns the Discord OAuth authorization URL for frontend navigation.
 */
export async function getDiscordAuthUrlHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = buildDiscordAuthUrl();
    res.status(200).json({
      success: true,
      data: {
        url,
        configured: Boolean(env.DISCORD_CLIENT_SECRET),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/discord
 * Directly redirects the user to Discord's OAuth2 authorization page.
 */
export async function discordRedirectHandler(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const url = buildDiscordAuthUrl();
    res.redirect(url);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/discord/callback
 * Handles Discord OAuth2 callback, verifies user membership, and issues session token.
 */
export async function discordCallbackHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      const errMsg = error_description || error;
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(String(errMsg))}`
      );
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent('No authorization code provided by Discord.')}`
      );
    }

    if (!env.DISCORD_CLIENT_SECRET) {
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=missing_secret&message=${encodeURIComponent(
          'DISCORD_CLIENT_SECRET is not configured in backend/.env. Please configure it to enable Discord OAuth.'
        )}`
      );
    }

    // Exchange authorization code for Discord access token
    const tokenRequestBody = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
    });

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenRequestBody.toString(),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Failed to exchange Discord authorization code:', errText);
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(
          'Failed to exchange Discord authorization code. Please try logging in again.'
        )}`
      );
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string };
    const accessToken = tokenData.access_token;

    // Fetch user profile from Discord
    const userProfileResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userProfileResponse.ok) {
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent('Failed to fetch Discord user profile.')}`
      );
    }

    const discordUser = (await userProfileResponse.json()) as {
      id: string;
      username: string;
      global_name?: string | null;
      avatar?: string | null;
    };

    // Find registered team member in MongoDB matching this Discord User ID
    const member = await User.findOne({ discordUserId: discordUser.id }).exec();

    if (!member) {
      const displayName = discordUser.global_name || discordUser.username;
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=user_not_registered&discordName=${encodeURIComponent(
          displayName
        )}&discordId=${discordUser.id}`
      );
    }

    if (!member.isActive) {
      return res.redirect(
        `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(
          'Your account is currently inactive. Please contact a team administrator.'
        )}`
      );
    }

    // Generate authenticated JWT session
    const jwtToken = createToken({
      id: member._id.toString(),
      name: member.name,
      registrationNo: member.registrationNo,
      role: member.role,
      discordUserId: member.discordUserId,
    });

    // Successfully redirect to frontend callback
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${jwtToken}&status=success`);
  } catch (error) {
    console.error('Discord OAuth callback error:', error);
    res.redirect(
      `${env.FRONTEND_URL}/auth/callback?error=${encodeURIComponent(
        'An unexpected error occurred during Discord authentication.'
      )}`
    );
  }
}
