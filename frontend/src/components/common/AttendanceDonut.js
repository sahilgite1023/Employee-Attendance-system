'use client';

import { useMemo } from 'react';

export default function AttendanceDonut({ stats = {} }) {
  const {
    present_days = 0,
    late_days = 0,
    absent_days = 0,
    leave_days = 0,
  } = stats;

  const total = present_days + late_days + absent_days + leave_days;

  const segments = useMemo(() => {
    if (total === 0) return [];
    
    const data = [
      { label: 'Present', value: present_days, color: '#10b981' },   // success-500 emerald
      { label: 'Late', value: late_days, color: '#f59e0b' },          // warning-500 amber
      { label: 'Absent', value: absent_days, color: '#f43f5e' },      // danger-500 rose
      { label: 'On Leave', value: leave_days, color: '#6366f1' },     // primary-500 indigo
    ].filter(d => d.value > 0);

    let cumulativePercent = 0;
    return data.map((d) => {
      const percent = (d.value / total) * 100;
      const startAngle = (cumulativePercent / 100) * 360;
      cumulativePercent += percent;
      const endAngle = (cumulativePercent / 100) * 360;
      return { ...d, percent, startAngle, endAngle };
    });
  }, [present_days, late_days, absent_days, leave_days, total]);

  // SVG donut chart
  const radius = 40;
  const cx = 50;
  const cy = 50;
  const strokeWidth = 12;

  function polarToCartesian(angle) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  }

  function describeArc(startAngle, endAngle) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  }

  const items = [
    { label: 'Present', value: present_days, color: 'bg-success-500', textColor: 'text-success-600' },
    { label: 'Late', value: late_days, color: 'bg-warning-500', textColor: 'text-warning-600' },
    { label: 'Absent', value: absent_days, color: 'bg-danger-500', textColor: 'text-danger-600' },
    { label: 'On Leave', value: leave_days, color: 'bg-primary-500', textColor: 'text-primary-600' },
  ];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      {/* Donut Chart */}
      <div className="relative flex-shrink-0">
        <svg width="120" height="120" viewBox="0 0 100 100">
          {total === 0 ? (
            <circle
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={strokeWidth}
            />
          ) : (
            segments.map((seg, i) => (
              <path
                key={i}
                d={describeArc(seg.startAngle, seg.endAngle - 0.5)}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            ))
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className="text-2xl font-bold text-slate-900">{total}</span>
            <br />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Days</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 flex-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}></span>
            <div>
              <p className="text-xs text-slate-500">{item.label}</p>
              <p className={`text-lg font-bold ${item.textColor}`}>{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
