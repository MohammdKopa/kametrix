'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

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
        <Button
          key={option.value}
          onClick={() => handleClick(option.value)}
          variant={activeValue === option.value ? 'default' : 'ghost'}
          size="sm"
          className={
            activeValue === option.value
              ? 'shadow-[0_0_12px_oklch(0.55_0.25_300_/_0.3)]'
              : ''
          }
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}
