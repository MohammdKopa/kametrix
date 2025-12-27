interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  warning?: boolean;
}

export function StatsCard({ title, value, subtitle, warning }: StatsCardProps) {
  return (
    <div className={`bg-white rounded-lg border p-6 ${warning ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="text-sm font-medium text-gray-500 mb-2">{title}</div>
      <div className={`text-3xl font-semibold mb-1 ${warning ? 'text-amber-600' : 'text-gray-900'}`}>{value}</div>
      {subtitle && (
        <div className={`text-sm ${warning ? 'text-amber-600' : 'text-gray-500'}`}>{subtitle}</div>
      )}
    </div>
  );
}
