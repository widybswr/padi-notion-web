import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStyle = (s: string) => {
    switch (s) {
      case 'Done':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40';
      case 'In progress design':
        return 'bg-sky-50 text-sky-700 border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40';
      case 'In PM review':
        return 'bg-purple-50 text-purple-700 border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40';
      case 'In review':
        return 'bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40';
      case 'Need revision':
        return 'bg-rose-50 text-rose-700 border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40';
      case 'On hold':
        return 'bg-pink-50 text-pink-700 border-pink-200/60 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-800/40';
      case 'Cancelled':
        return 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700';
      case 'Not started':
      default:
        return 'bg-zinc-100 text-zinc-600 border-zinc-200/80 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  const getDotColor = (s: string) => {
    switch (s) {
      case 'Done': return 'bg-emerald-500';
      case 'In progress design': return 'bg-sky-500';
      case 'In PM review': return 'bg-purple-500';
      case 'In review': return 'bg-amber-500';
      case 'Need revision': return 'bg-rose-500';
      case 'On hold': return 'bg-pink-500';
      default: return 'bg-zinc-400';
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded border ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'
      } ${getStyle(status)}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor(status)}`} />
      {status}
    </span>
  );
};
