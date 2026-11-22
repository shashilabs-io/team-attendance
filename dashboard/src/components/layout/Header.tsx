import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, RefreshCw, Sun, Moon, LogOut } from 'lucide-react';
import { checkHealth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { LoginModal } from '../auth/LoginModal';

interface HeaderProps {
  onMenuClick: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  onRefresh,
  isRefreshing = false,
}) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const { user, isAuthenticated, logout } = useAuth();

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [checking, setChecking] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [secondsAgo, setSecondsAgo] = useState<number>(0);

  // Map route to human title & description
  const getPageMeta = (path: string): { title: string; subtitle: string } => {
    switch (path) {
      case '/':
        return {
          title: 'Overview',
          subtitle: 'Live team attendance & session pulse',
        };
      case '/attendance':
        return {
          title: 'Attendance History',
          subtitle: 'Audit log of all member check-ins and check-outs',
        };
      case '/members':
        return {
          title: 'Team Members',
          subtitle: 'Roster of registered team members and active status',
        };
      case '/statistics':
        return {
          title: 'Statistics & Analytics',
          subtitle: 'Multi-period trends, heatmaps, and leaderboard',
        };
      default:
        return {
          title: 'Dashboard',
          subtitle: 'Team attendance monitoring system',
        };
    }
  };

  const verifyConnection = async () => {
    setChecking(true);
    try {
      const ok = await checkHealth();
      setIsConnected(ok);
      if (ok) {
        setLastUpdated(new Date());
        setSecondsAgo(0);
      }
    } catch {
      setIsConnected(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    checkHealth()
      .then((ok) => {
        if (isMounted) {
          setIsConnected(ok);
          setLastUpdated(new Date());
        }
      })
      .catch(() => {
        if (isMounted) setIsConnected(false);
      });

    const interval = setInterval(() => {
      checkHealth()
        .then((ok) => {
          if (isMounted) {
            setIsConnected(ok);
            setLastUpdated(new Date());
          }
        })
        .catch(() => {
          if (isMounted) setIsConnected(false);
        });
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Update relative elapsed seconds timer
  useEffect(() => {
    const timer = setInterval(() => {
      const sec = Math.floor((Date.now() - lastUpdated.getTime()) / 1000);
      setSecondsAgo(sec);
    }, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const handleManualRefresh = async () => {
    if (onRefresh) {
      onRefresh();
      setLastUpdated(new Date());
      setSecondsAgo(0);
      showToast('Data refreshed successfully', 'success');
    } else {
      await verifyConnection();
      showToast('API connection verified', 'info');
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    showToast(theme === 'light' ? 'Switched to Dark Mode' : 'Switched to Light Mode', 'info');
  };

  const pageMeta = getPageMeta(location.pathname);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Left: Mobile hamburger & Titles */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="p-2 -ml-2 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 hidden sm:inline">
              Team Attendance
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">/</span>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">
              {pageMeta.title}
            </h1>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
            {pageMeta.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Connectivity, Relative Time, Refresh, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Last sync time */}
        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hidden lg:inline whitespace-nowrap">
          Updated {secondsAgo < 5 ? 'just now' : `${secondsAgo}s ago`}
        </span>

        {/* API Status Badge */}
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
            isConnected === true
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60'
              : isConnected === false
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/60'
              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
          }`}
          role="status"
          aria-live="polite"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected === true
                ? 'bg-emerald-500 animate-pulse'
                : isConnected === false
                ? 'bg-rose-500'
                : 'bg-slate-400'
            }`}
          />
          <span className="hidden sm:inline">
            {isConnected === true
              ? 'Connected'
              : isConnected === false
              ? 'Offline'
              : 'Checking...'}
          </span>
        </div>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing || checking}
          title="Refresh current data"
          aria-label="Refresh data"
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing || checking ? 'animate-spin' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {theme === 'light' ? (
            <Moon className="w-4 h-4 text-slate-700" />
          ) : (
            <Sun className="w-4 h-4 text-amber-400" />
          )}
        </button>

        {/* User Auth Section */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="hidden sm:flex flex-col items-end text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white leading-none">
                  {user.name}
                </span>
                {user.role === 'ADMIN' && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60">
                    ADMIN
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                {user.registrationNo}
              </span>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] active:bg-[#3c45a5] transition-colors shadow-xs shadow-[#5865F2]/20 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 127.14 96.36">
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,45.91,53.87,53,48.83,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,45.91,96.11,53,91.08,65.69,84.69,65.69Z" />
            </svg>
            <span>Sign In</span>
          </button>
        )}
      </div>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />
    </header>
  );
};
