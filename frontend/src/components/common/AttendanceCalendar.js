'use client';

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';

const STATUS_COLORS = {
  'on-time': {
    bg: 'bg-success-500',
    light: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-300',
    label: 'Present',
    dot: 'bg-success-500',
  },
  present: {
    bg: 'bg-success-500',
    light: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-300',
    label: 'Present',
    dot: 'bg-success-500',
  },
  late: {
    bg: 'bg-warning-500',
    light: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-300',
    label: 'Late',
    dot: 'bg-warning-500',
  },
  absent: {
    bg: 'bg-danger-500',
    light: 'bg-danger-100',
    text: 'text-danger-700',
    border: 'border-danger-300',
    label: 'Absent',
    dot: 'bg-danger-500',
  },
  'half-day': {
    bg: 'bg-warning-500',
    light: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-300',
    label: 'Half Day',
    dot: 'bg-warning-500',
  },
  'on-leave': {
    bg: 'bg-primary-500',
    light: 'bg-primary-100',
    text: 'text-primary-700',
    border: 'border-primary-300',
    label: 'On Leave',
    dot: 'bg-primary-500',
  },
};

function getStatusColor(status) {
  return STATUS_COLORS[status?.toLowerCase()] || {
    bg: 'bg-slate-400',
    light: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-300',
    label: status || 'Unknown',
    dot: 'bg-slate-400',
  };
}

function formatTimeShort(dateStr) {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(d, 'hh:mm a');
  } catch {
    return '';
  }
}

export default function AttendanceCalendar({ records = [], onDateClick }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Build a map of date -> attendance record
  const attendanceMap = useMemo(() => {
    const map = {};
    records.forEach((record) => {
      if (record.attendance_date) {
        const dateKey = format(
          typeof record.attendance_date === 'string'
            ? parseISO(record.attendance_date)
            : record.attendance_date,
          'yyyy-MM-dd'
        );
        map[dateKey] = record;
      }
    });
    return map;
  }, [records]);

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Build weeks array
  const weeks = [];
  let day = calStart;
  while (day <= calEnd) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const selectedRecord = selectedDate
    ? attendanceMap[format(selectedDate, 'yyyy-MM-dd')]
    : null;

  const handleDateClick = (date) => {
    setSelectedDate(date);
    if (onDateClick) {
      const dateKey = format(date, 'yyyy-MM-dd');
      onDateClick(date, attendanceMap[dateKey] || null);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h3>
        </div>

        <div className="flex gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Next month"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
          {dayNames.map((dayName) => (
            <div
              key={dayName}
              className="py-2 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
            {week.map((date, dayIdx) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const record = attendanceMap[dateKey];
              const inMonth = isSameMonth(date, currentMonth);
              const today = isToday(date);
              const selected = selectedDate && isSameDay(date, selectedDate);
              const statusColor = record ? getStatusColor(record.status) : null;
              const isSunday = date.getDay() === 0;

              return (
                <button
                  key={dayIdx}
                  onClick={() => inMonth && handleDateClick(date)}
                  disabled={!inMonth}
                  className={`
                    relative min-h-[60px] sm:min-h-[72px] p-1 sm:p-2 text-left transition-all duration-150
                    ${!inMonth ? 'bg-slate-50 opacity-40 cursor-default' : 'hover:bg-slate-50 cursor-pointer'}
                    ${selected ? 'ring-2 ring-primary-500 ring-inset bg-primary-50' : ''}
                    ${today && !selected ? 'bg-primary-50' : ''}
                    ${dayIdx < 6 ? 'border-r border-slate-100' : ''}
                  `}
                >
                  <span
                    className={`
                      text-xs sm:text-sm font-medium
                      ${!inMonth ? 'text-slate-400' : ''}
                      ${today ? 'text-primary-600 font-bold' : ''}
                      ${isSunday && inMonth ? 'text-danger-500' : ''}
                      ${!today && !isSunday && inMonth ? 'text-slate-700' : ''}
                    `}
                  >
                    {format(date, 'd')}
                  </span>

                  {/* Status Indicator */}
                  {record && inMonth && (
                    <div className="mt-0.5">
                      <div
                        className={`
                          ${statusColor.light} ${statusColor.text} ${statusColor.border}
                          text-[9px] sm:text-[10px] font-semibold px-1 py-0.5 rounded border
                          truncate leading-tight
                        `}
                      >
                        <span className="hidden sm:inline">{statusColor.label}</span>
                        <span className="sm:hidden">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusColor.dot}`}></span>
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Today Indicator Dot */}
                  {today && inMonth && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                      <div className="w-1 h-1 bg-primary-500 rounded-full"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap gap-3 px-1">
        {Object.entries(STATUS_COLORS).filter(([key]) => 
          ['present', 'late', 'absent', 'on-leave', 'half-day'].includes(key)
        ).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-full ${color.dot}`}></span>
            <span className="text-xs text-slate-600">{color.label}</span>
          </div>
        ))}
      </div>

      {/* Selected Date Detail Panel */}
      {selectedDate && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 animate-in">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h4>
            <button
              onClick={() => setSelectedDate(null)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedRecord ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Status:</span>
                {(() => {
                  const sc = getStatusColor(selectedRecord.status);
                  return (
                    <span className={`${sc.light} ${sc.text} ${sc.border} text-xs font-semibold px-2.5 py-1 rounded-full border`}>
                      {sc.label}
                    </span>
                  );
                })()}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 ring-1 ring-inset ring-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Check In</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatTimeShort(selectedRecord.check_in_time) || '--:--'}
                  </p>
                </div>
                <div className="bg-slate-50 ring-1 ring-inset ring-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Check Out</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {formatTimeShort(selectedRecord.check_out_time) || '--:--'}
                  </p>
                </div>
                <div className="bg-slate-50 ring-1 ring-inset ring-slate-100 rounded-xl p-3">
                  <p className="text-xs text-slate-500 mb-0.5">Total Hours</p>
                  <p className="text-sm font-semibold text-slate-900 tabular-nums">
                    {selectedRecord.total_hours || '--'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <svg className="w-10 h-10 text-slate-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm text-slate-500">No attendance record for this date</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
