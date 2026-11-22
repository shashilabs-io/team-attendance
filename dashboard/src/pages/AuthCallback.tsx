import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { setStoredToken, initiateDiscordLogin } from '../services/api';
import { AlertTriangle, CheckCircle, ArrowLeft, RefreshCw, KeyRound, HelpCircle } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const { showToast } = useToast();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [discordName, setDiscordName] = useState<string | null>(null);
  const [discordId, setDiscordId] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    const name = searchParams.get('discordName');
    const id = searchParams.get('discordId');

    if (error) {
      setStatus('error');
      setErrorCode(error);
      setErrorMessage(message || error);
      if (name) setDiscordName(name);
      if (id) setDiscordId(id);
      return;
    }

    if (token) {
      setStatus('loading');
      setStoredToken(token);
      loginWithToken(token)
        .then(() => {
          setStatus('success');
          showToast('Signed in with Discord successfully!', 'success');
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 800);
        })
        .catch((err) => {
          console.error('Failed to complete login from token:', err);
          setStatus('error');
          setErrorMessage(err.message || 'Failed to initialize session.');
        });
    } else {
      setStatus('error');
      setErrorMessage('No authentication token or authorization code found.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-[#5865F2]/10 flex items-center justify-center text-[#5865F2] animate-bounce">
              <svg className="w-8 h-8 fill-current" viewBox="0 0 127.14 96.36">
                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.11,53,91.08,65.69,84.69,65.69Z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Authenticating with Discord...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Verifying your Discord profile against team roster...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Authenticated Successfully!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Redirecting you to the dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Authentication Failed
            </h2>

            {errorCode === 'missing_secret' ? (
              <div className="text-left bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 text-xs space-y-2 text-amber-800 dark:text-amber-300">
                <div className="flex items-center gap-2 font-semibold">
                  <KeyRound className="w-4 h-4 text-amber-600" />
                  <span>Discord Client Secret Required</span>
                </div>
                <p>
                  To complete Discord OAuth, please copy your <strong>Client Secret</strong> from the Discord Developer Portal and paste it into <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">backend/.env</code>:
                </p>
                <div className="font-mono bg-slate-900 text-slate-100 p-2 rounded-lg text-[11px] overflow-x-auto">
                  DISCORD_CLIENT_SECRET=your_client_secret_here
                </div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400">
                  After setting it, restart backend and try again.
                </p>
              </div>
            ) : errorCode === 'user_not_registered' ? (
              <div className="text-left bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl p-4 text-xs space-y-2 text-rose-800 dark:text-rose-300">
                <div className="flex items-center gap-2 font-semibold">
                  <HelpCircle className="w-4 h-4 text-rose-600" />
                  <span>Discord Account Not Registered</span>
                </div>
                <p>
                  Your Discord account <strong>@{discordName || 'User'}</strong> {discordId ? `(ID: ${discordId})` : ''} was not found in the team attendance database.
                </p>
                <p className="text-[11px]">
                  Please contact a team administrator to register your Discord ID or use the <code>/register</code> bot command on your Discord server.
                </p>
              </div>
            ) : (
              <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl p-3 text-xs text-rose-700 dark:text-rose-300">
                {errorMessage || 'An error occurred while authenticating with Discord.'}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 w-full pt-4">
              <Link
                to="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  initiateDiscordLogin();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
