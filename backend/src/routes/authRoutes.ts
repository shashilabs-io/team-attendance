import { Router } from 'express';
import {
  loginHandler,
  getMeHandler,
  updatePasswordHandler,
  getDiscordAuthUrlHandler,
  discordRedirectHandler,
  discordCallbackHandler,
} from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.middleware.js';

const router = Router();

// Discord OAuth2
router.get('/discord/url', getDiscordAuthUrlHandler);
router.get('/discord', discordRedirectHandler);
router.get('/discord/callback', discordCallbackHandler);

// Public: Log in (Registration number & password)
router.post('/login', loginHandler);

// Protected: Get current user profile
router.get('/me', authenticateUser, getMeHandler);

// Protected: Update password
router.post('/password', authenticateUser, updatePasswordHandler);

export default router;
