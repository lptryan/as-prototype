import React from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatsCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'bg-blue-100 text-blue-600',
  subtitle,
  className
}) {
  return (
    <div className={cn("bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow duration-300", className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              {changeType === 'positive' ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : changeType === 'negative' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : null}
              <span className={cn(
                "text-sm font-medium",
                changeType === 'positive' && "text-emerald-600",
                changeType === 'negative' && "text-red-600",
                changeType === 'neutral' && "text-slate-500"
              )}>
                {change}
              </span>
              {subtitle && <span className="text-sm text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={cn("p-3 rounded-xl", iconColor)}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}