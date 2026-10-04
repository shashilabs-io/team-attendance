import React, { useState, useEffect } from 'react';
import { getUsers, getActiveAttendance } from '../services/api';
import type { User, ActiveMember } from '../types/api';
import { formatDate, copyToClipboard } from '../utils/formatters';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import { Users, Search, Shield, User as UserIcon, X, Copy, Radio } from 'lucide-react';

export const Members: React.FC = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    Promise.all([getUsers(), getActiveAttendance()])
      .then(([userData, activeData]) => {
        setUsers(userData);
        setActiveMembers(activeData);
        setError(null);
        showToast('Team members list updated', 'success');
      })
      .catch((err: any) => {
        console.error('Failed to load members:', err);
        setError(err.message || 'Unable to retrieve team members.');
        showToast('Failed to load members', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    Promise.all([getUsers(), getActiveAttendance()])
      .then(([userData, activeData]) => {
        setUsers(userData);
        setActiveMembers(activeData);
        setError(null);
      })
      .catch((err: any) => {
        console.error('Failed to load members:', err);
        setError(err.message || 'Unable to retrieve team members.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast(`Copied ${text} to clipboard`, 'success');
    }
  };

  const activeRegSet = new Set(activeMembers.map((m) => m.registrationNo));

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.registrationNo.toLowerCase().includes(q) ||
      u.discordUserId.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Team Members
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Registered team roster synchronized with Discord and MongoDB.
          </p>
        </div>

        {/* Clearable Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name, reg no, or Discord ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear member search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {loading && <TableSkeleton rows={8} cols={6} />}

        {error && !loading && (
          <ErrorState
            title="Failed to load members"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!loading && !error && filteredUsers.length === 0 && (
          <EmptyState
            title="No Members Found"
            message={
              searchQuery
                ? `No members match '${searchQuery}'.`
                : 'No registered team members found.'
            }
            icon={<Users className="w-5 h-5 text-slate-400" />}
          />
        )}

        {!loading && !error && filteredUsers.length > 0 && (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60 sticky top-0">
                  <th scope="col" className="py-3.5 px-4">Member</th>
                  <th scope="col" className="py-3.5 px-4">Registration No.</th>
                  <th scope="col" className="py-3.5 px-4">Role</th>
                  <th scope="col" className="py-3.5 px-4">Account Status</th>
                  <th scope="col" className="py-3.5 px-4">Live Presence</th>
                  <th scope="col" className="py-3.5 px-4">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredUsers.map((user) => {
                  const isCheckedIn = activeRegSet.has(user.registrationNo);

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center font-bold text-xs uppercase shadow-2xs">
                            {user.name.slice(0, 2)}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {user.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(user.registrationNo)}
                          title="Click to copy registration number"
                          className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer group"
                        >
                          <span>{user.registrationNo}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                            <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <UserIcon className="w-3 h-3 text-slate-500" />
                            MEMBER
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            🟢 Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            ⚪ Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isCheckedIn ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                            <Radio className="w-3 h-3 animate-pulse" />
                            🟢 Checked In
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                            ⚪ Not Checked In
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {formatDate(user.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
