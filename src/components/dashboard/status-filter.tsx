'use client';

import { useRouter } from 'next/navigation';

interface StatusFilterProps {
  currentStatus?: string;
}

export function StatusFilter({ currentStatus }: StatusFilterProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', value);
    }
    router.push(url.pathname + url.search);
  };

  return (
    <div className="flex items-center gap-4">
      <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
        Filter by status:
      </label>
      <select
        id="status-filter"
        name="status"
        value={currentStatus || 'all'}
        onChange={handleChange}
        className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
      >
        <option value="all">All</option>
        <option value="COMPLETED">Completed</option>
        <option value="IN_PROGRESS">In Progress</option>
        <option value="FAILED">Failed</option>
        <option value="NO_ANSWER">No Answer</option>
        <option value="RINGING">Ringing</option>
      </select>
    </div>
  );
}
