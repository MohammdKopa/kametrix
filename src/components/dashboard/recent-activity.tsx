import { Phone } from 'lucide-react';

export function RecentActivity() {
  return (
    <div className="glass-card">
      <div className="p-6 border-b border-gray-200 dark:border-[var(--border)]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-[var(--foreground)]">Recent Activity</h2>
      </div>
      <div className="p-12 text-center">
        <div className="text-gray-400 dark:text-[var(--muted-foreground)] mb-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-[var(--muted)] flex items-center justify-center">
            <Phone className="h-8 w-8" />
          </div>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-[var(--foreground)] mb-1">No recent activity</p>
        <p className="text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
          Call activity will appear here once you have active agents
        </p>
      </div>
    </div>
  );
}
