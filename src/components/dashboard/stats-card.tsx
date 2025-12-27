import { Wallet, Bot, Phone, LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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
    <Card
      className={`
        glass-card border-0 py-0
        transition-all duration-300
        hover:shadow-[0_0_30px_oklch(0.55_0.25_300/0.15)]
        ${warning
          ? 'border border-amber-500/50 hover:shadow-[0_0_30px_oklch(0.7_0.15_85/0.2)]'
          : ''
        }
      `}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </div>
            <div
              className={`text-3xl font-semibold mb-1 ${
                warning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-foreground'
              }`}
            >
              {value}
            </div>
            {subtitle && (
              <div
                className={`text-sm ${
                  warning
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-muted-foreground'
                }`}
              >
                {subtitle}
              </div>
            )}
          </div>
          {Icon && (
            <div
              className={`
                p-3 rounded-xl
                ${warning
                  ? 'bg-amber-500/20 text-amber-500 dark:text-amber-400 shadow-[0_0_12px_oklch(0.7_0.15_85/0.3)]'
                  : 'bg-gradient-to-br from-primary/20 to-accent/20 text-primary dark:text-accent'
                }
              `}
            >
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
