import { Wallet, Bot, Phone, LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  warning?: boolean;
  icon?: 'wallet' | 'bot' | 'phone';
}

const iconMap: Record<string, LucideIcon> = {
  wallet: Wallet,
  bot: Bot,
  phone: Phone,
};

export function StatsCard({ title, value, subtitle, warning, icon }: StatsCardProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <div
      className={`
        glass-card p-6 transition-all duration-200
        hover:shadow-md dark:hover:shadow-[0_0_20px_rgba(152,58,214,0.15)]
        ${warning
          ? 'border-amber-300 dark:border-amber-500/50'
          : ''
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-500 dark:text-[var(--muted-foreground)] mb-2">
            {title}
          </div>
          <div
            className={`text-3xl font-semibold mb-1 ${
              warning
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-gray-900 dark:text-[var(--foreground)]'
            }`}
          >
            {value}
          </div>
          {subtitle && (
            <div
              className={`text-sm ${
                warning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-[var(--muted-foreground)]'
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className={`
              p-2.5 rounded-lg
              ${warning
                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400'
                : 'bg-gray-100 text-gray-600 dark:bg-[var(--accent)]/20 dark:text-[var(--accent)]'
              }
            `}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
