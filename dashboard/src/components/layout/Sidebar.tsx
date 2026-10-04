import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  BarChart3,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck },
    { to: '/members', label: 'Members', icon: Users },
    { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-slate-900 dark:bg-slate-950 text-slate-200 border-r border-slate-800 dark:border-slate-800/80 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 dark:border-slate-800/80">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'lg:justify-center w-full' : ''}`}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden whitespace-nowrap">
                <span className="font-extrabold text-white text-base tracking-tight block">
                  TeamTrack
                </span>
                <span className="block text-[11px] text-slate-400 font-normal">
                  Attendance Core
                </span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Navigation
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                title={isCollapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isCollapsed ? 'lg:justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}

          {/* Google Form Link */}
          <div className="pt-3 mt-3 border-t border-slate-800 dark:border-slate-800/80">
            <a
              href="https://forms.gle/W7mgqkCSUFThucJ3A"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
              title={isCollapsed ? 'Submit Attendance (Google Form)' : undefined}
              aria-label="Submit attendance using Google Form"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-slate-300 hover:bg-slate-800/80 hover:text-white border border-slate-800/70 hover:border-slate-700 group focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                isCollapsed ? 'lg:justify-center' : 'justify-between'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 shrink-0 text-blue-400 group-hover:text-blue-300" />
                {!isCollapsed && <span className="truncate">Submit Attendance</span>}
              </div>
              {!isCollapsed && (
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 shrink-0" />
              )}
            </a>
          </div>
        </nav>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden lg:flex items-center justify-end p-3 border-t border-slate-800 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer w-full flex items-center justify-center gap-2 text-xs"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-[11px] text-slate-400">Collapse sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
