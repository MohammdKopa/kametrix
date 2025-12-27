'use client';

import { useRouter } from 'next/navigation';

interface StatusFilterProps {
  currentStatus?: string;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'NO_ANSWER', label: 'No Answer' },
  { value: 'RINGING', label: 'Ringing' },
];

export function StatusFilter({ currentStatus }: StatusFilterProps) {
  const router = useRouter();

  const handleClick = (value: string) => {
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', value);
    }
    router.push(url.pathname + url.search);
  };

  const activeValue = currentStatus || 'all';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STATUS_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => handleClick(option.value)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
            activeValue === option.value
              ? 'bg-[var(--accent)] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-[var(--foreground)] dark:hover:bg-white/20'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
