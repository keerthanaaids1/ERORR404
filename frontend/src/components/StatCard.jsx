import React from 'react';

export default function StatCard({ title, value, subtext, highlight = false }) {
  return (
    <div className="wp-card wp-card-hover p-6 flex flex-col justify-between min-h-[140px]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-mutedgray mb-2">
          {title}
        </p>
        <p className={`text-3xl md:text-4xl font-extrabold tracking-tight ${highlight ? 'text-accent glow-text' : 'text-offwhite'}`}>
          {value}
        </p>
      </div>
      {subtext && (
        <span className="text-xs text-mutedgray mt-3 flex items-center gap-1.5">
          {subtext}
        </span>
      )}
    </div>
  );
}
