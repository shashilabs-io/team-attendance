import React, { useState, useEffect } from 'react';
import { getAttendance, getUsers } from '../services/api';
import type { AttendanceSession, Pagination, User } from '../types/api';
import {
  formatDate,
  formatTime,
  formatMinutes,
  copyToClipboard,
} from '../utils/formatters';
import { ErrorState } from '../components/common/ErrorState';
import { EmptyState } from '../components/common/EmptyState';
import { TableSkeleton } from '../components/common/Skeleton';
import { useToast } from '../context/ToastContext';
import {
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Search,
  X,
  Copy,
} from 'lucide-react';

export const Attendance: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRegNo, setSelectedRegNo] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Pagination State
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Load registered users once for filter dropdown
  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.warn('Could not load user list for filters:', err));
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    getAttendance({
      page,
      limit,
      registrationNo: selectedRegNo || undefined,
      status: (selectedStatus as 'ACTIVE' | 'COMPLETED') || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((res) => {
        setSessions(res.data);
        setPagination(res.pagination);
        setError(null);
        showToast('Attendance data refreshed', 'success');
      })
      .catch((err: any) => {
        setError(err.message || 'Unable to retrieve attendance history.');
        showToast('Failed to load attendance', 'error');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    getAttendance({
      page,
      limit,
      registrationNo: selectedRegNo || undefined,
      status: (selectedStatus as 'ACTIVE' | 'COMPLETED') || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
      .then((res) => {
        if (isMounted) {
          setSessions(res.data);
          setPagination(res.pagination);
          setError(null);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setError(err.message || 'Unable to retrieve attendance history.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [page, limit, selectedRegNo, selectedStatus, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedRegNo('');
    setSelectedStatus('');
    setStartDate('');
    setEndDate('');
    setPage(1);
    showToast('Filters cleared', 'info');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
    }
  };

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      showToast(`Copied ${text} to clipboard`, 'success');
    }
  };

  // Client-side quick filter on current page results if search query is entered
  const displayedSessions = sessions.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      s.name.toLowerCase().includes(q) ||
      s.registrationNo.toLowerCase().includes(q) ||
      (s.task && s.task.toLowerCase().includes(q))
    );
  });

  const hasActiveFilters = Boolean(
    searchQuery || selectedRegNo || selectedStatus || startDate || endDate
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Attendance History
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Complete paginated audit log of team attendance sessions and working hours.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs transition-colors space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            <span>Search & Filter</span>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Quick Search */}
          <div>
            <label htmlFor="search-input" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="search-input"
                type="text"
                placeholder="Name or reg no..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-7 py-2 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Member Filter */}
          <div>
            <label htmlFor="member-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Member
            </label>
            <select
              id="member-filter"
              value={selectedRegNo}
              onChange={(e) => {
                setSelectedRegNo(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.registrationNo}>
                  {u.name} ({u.registrationNo})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="COMPLETED">Completed Only</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="start-date-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              From Date
            </label>
            <input
              id="start-date-filter"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label htmlFor="end-date-filter" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              To Date
            </label>
            <input
              id="end-date-filter"
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {loading && <TableSkeleton rows={7} cols={8} />}

        {error && !loading && (
          <ErrorState
            title="Failed to load attendance"
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!loading && !error && displayedSessions.length === 0 && (
          <EmptyState
            title="No Attendance Records"
            message="No attendance sessions matched your selected filter criteria."
          />
        )}

        {!loading && !error && displayedSessions.length > 0 && (
          <>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/80 dark:bg-slate-800/60 sticky top-0">
                    <th scope="col" className="py-3.5 px-4">Date</th>
                    <th scope="col" className="py-3.5 px-4">Member</th>
                    <th scope="col" className="py-3.5 px-4">Registration No.</th>
                    <th scope="col" className="py-3.5 px-4">Task</th>
                    <th scope="col" className="py-3.5 px-4">Check In</th>
                    <th scope="col" className="py-3.5 px-4">Check Out</th>
                    <th scope="col" className="py-3.5 px-4">Duration</th>
                    <th scope="col" className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {displayedSessions.map((session) => (
                    <tr
                      key={session.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatDate(session.checkIn)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {session.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => handleCopy(session.registrationNo)}
                          title="Click to copy registration number"
                          className="inline-flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer group"
                        >
                          <span>{session.registrationNo}</span>
                          <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>
                      <td
                        className="py-3.5 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate"
                        title={session.task}
                      >
                        {session.task || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatTime(session.checkIn)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {session.checkOut ? formatTime(session.checkOut) : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {session.status === 'COMPLETED' ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {formatMinutes(session.durationMinutes)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {session.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            <Check className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                            COMPLETED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Show</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-800 dark:text-slate-200"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span>entries</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span>
                  Showing{' '}
                  {displayedSessions.length > 0
                    ? (pagination.page - 1) * pagination.limit + 1
                    : 0}{' '}
                  to {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {pagination.total}
                  </span>{' '}
                  records
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 font-semibold text-slate-800 dark:text-slate-200">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
