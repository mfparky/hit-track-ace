import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconColor?: string;
  trend?: 'up' | 'down' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
}

export function StatCard({ label, value, icon: Icon, iconColor = 'text-primary', trend, size = 'md' }: StatCardProps) {
  const sizes = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const valueSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  return (
    <div
      className={cn(
        'rounded-lg bg-card border border-border shadow-sm transition-all hover:shadow-md',
        sizes[size]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="stat-label mb-1">{label}</p>
          <p className={cn('stat-value', valueSizes[size])}>
            {value}
          </p>
        </div>
        {Icon && (
          <div className={cn('p-2 rounded-lg bg-muted', iconColor)}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-success',
              trend === 'down' && 'text-destructive',
              trend === 'neutral' && 'text-muted-foreground'
            )}
          >
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'neutral' && '→'}
          </span>
          <span className="text-xs text-muted-foreground">vs last 7 days</span>
        </div>
      )}
    </div>
  );
}
