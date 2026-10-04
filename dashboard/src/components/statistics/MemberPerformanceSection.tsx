import React from 'react';
import type { MemberPerformance } from '../../types/api';
import { formatMinutes } from '../../utils/formatters';
import { EmptyState } from '../common/EmptyState';
import { Trophy, Award, Medal, Users, BarChart2 } from 'lucide-react';

interface MemberPerformanceSectionProps {
  members: MemberPerformance[];
  loading: boolean;
}

export const MemberPerformanceSection: React.FC<MemberPerformanceSectionProps> = ({
  members,
  loading,
}) => {
  if (!loading && members.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Member Performance</h3>
        </div>
        <EmptyState message="No member attendance recorded for this period." />
      </div>
    );
  }

  // Highest total attendance minutes
  const topMember = members[0];
  const topThree = members.slice(0, 3);
  const maxMinutes = topMember ? Math.max(topMember.totalMinutes, 60) : 60;

  return (
    <div className="space-y-6">
      {/* 1. TOP 3 PODIUM & MOST ACTIVE LEADERBOARD */}
      {topMember && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Most Active Champion Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300">
                <Trophy className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
                🏆 Most Active Member
              </span>
              <span className="text-xs font-mono font-bold text-amber-800 dark:text-amber-300">#1 RANK</span>
            </div>

            <div className="my-4">
              <h4 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{topMember.name}</h4>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-0.5">
                {topMember.registrationNo}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-amber-200/80 dark:border-amber-800/40 text-center">
              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Hours
                </span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-300">
                  {formatMinutes(topMember.totalMinutes)}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Sessions
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {topMember.sessions}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Days
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {topMember.attendanceDays}d
                </span>
              </div>
            </div>
          </div>

          {/* Top 3 Podium List */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between transition-colors duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Top 3 Leaderboard</h4>
              </div>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Ranked by Total Hours</span>
            </div>

            <div className="space-y-2.5">
              {topThree.map((m, idx) => {
                const rankIcons = [
                  <Trophy key={1} className="w-4 h-4 text-amber-500" />,
                  <Award key={2} className="w-4 h-4 text-slate-400" />,
                  <Medal key={3} className="w-4 h-4 text-amber-700 dark:text-amber-400" />,
                ];

                return (
                  <div
                    key={m.userId}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs">
                        {rankIcons[idx] || idx + 1}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</span>
                        <span className="text-xs font-mono text-slate-500 dark:text-slate-400 block">
                          {m.registrationNo}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-sm font-bold text-purple-700 dark:text-purple-400">
                          {formatMinutes(m.totalMinutes)}
                        </span>
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                          {m.sessions} sessions ({m.attendanceDays} days)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. MEMBER HOURS BAR CHART */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Member Attendance Hours
            </h3>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Sorted Descending
          </span>
        </div>

        <div className="space-y-3">
          {members.map((m) => {
            const percentage = Math.min(
              100,
              Math.max(4, Math.round((m.totalMinutes / maxMinutes) * 100))
            );
            return (
              <div key={m.userId} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {m.name}{' '}
                    <span className="font-mono text-slate-500 dark:text-slate-400">({m.registrationNo})</span>
                  </span>
                  <span className="text-slate-900 dark:text-slate-100 font-bold">
                    {formatMinutes(m.totalMinutes)}{' '}
                    <span className="text-slate-500 dark:text-slate-400 font-normal">
                      ({m.attendanceDays} {m.attendanceDays === 1 ? 'day' : 'days'})
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-purple-600 dark:bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MEMBER ANALYTICS TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Detailed Member Performance Table
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {members.length} team members
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar -mx-5 px-5">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/60">
                <th scope="col" className="py-3 px-4">Member</th>
                <th scope="col" className="py-3 px-4">Registration No.</th>
                <th scope="col" className="py-3 px-4">Attendance Days</th>
                <th scope="col" className="py-3 px-4">Sessions</th>
                <th scope="col" className="py-3 px-4">Completed</th>
                <th scope="col" className="py-3 px-4">Total Hours</th>
                <th scope="col" className="py-3 px-4">Avg Session</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {members.map((m) => (
                <tr key={m.userId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{m.name}</td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {m.registrationNo}
                  </td>
                  <td className="py-3 px-4 font-semibold text-blue-700 dark:text-blue-400">
                    {m.attendanceDays} days
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{m.sessions}</td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{m.completedSessions}</td>
                  <td className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400 text-xs">
                    {formatMinutes(m.totalMinutes)}
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                    {formatMinutes(m.averageMinutes)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
