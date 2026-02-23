import React from 'react';
import StatsCard from './components/StatsCard';

export interface DashboardStats {
  totalToday: number;
  pending: number;
  newMessages: number;
  completed: number;
}

export interface StatsCardsProps {
  stats: DashboardStats;
}

const STATS_CONFIG = [
  { key: 'totalToday', label: 'CITAS HOY', icon: 'calendar_today', color: 'bg-primary' },
  { key: 'pending', label: 'PENDIENTES', icon: 'assignment_late', color: 'bg-amber-500' },
  { key: 'newMessages', label: 'MENSAJES', icon: 'mail', color: 'bg-blue-500' },
  { key: 'completed', label: 'REALIZADAS', icon: 'check_circle', color: 'bg-emerald-500' },
] as const;

const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => (
  <div className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 lg:gap-4">
    {STATS_CONFIG.map(({ key, label, icon, color }) => (
      <StatsCard
        key={key}
        label={label}
        value={stats[key]}
        icon={icon}
        color={color}
      />
    ))}
  </div>
);

export default StatsCards;
