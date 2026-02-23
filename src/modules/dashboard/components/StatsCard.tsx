import React from 'react';

export interface StatsCardProps {
  label: string;
  value: number;
  icon: string;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200 shadow-sm flex items-center gap-2 sm:gap-5">
    <div className={`size-9 sm:size-14 rounded-lg sm:rounded-2xl ${color} text-white flex items-center justify-center shadow-lg shrink-0`}>
      <span className="material-symbols-outlined text-xl sm:text-3xl">{icon}</span>
    </div>
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-0.5 truncate">{label}</p>
      <p className="text-lg sm:text-3xl font-black text-slate-800 leading-none">{value}</p>
    </div>
  </div>
);

export default StatsCard;
