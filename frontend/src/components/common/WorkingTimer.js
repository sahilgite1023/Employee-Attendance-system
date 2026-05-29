'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * WorkingTimer - Live HH:MM:SS timer that counts up from check-in time
 * 
 * @param {string} checkInTime - ISO timestamp of when user checked in
 * @param {number} serverDurationSeconds - Initial duration from server (for sync)
 * @param {string} serverTime - Server's current time ISO string (for clock drift correction)
 */
export default function WorkingTimer({ checkInTime, serverDurationSeconds = 0, serverTime }) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!checkInTime) {
      setElapsed(0);
      return;
    }

    // Calculate initial elapsed using server time if available, otherwise client time
    let initialElapsed;
    if (serverDurationSeconds > 0) {
      initialElapsed = serverDurationSeconds;
    } else {
      const checkIn = new Date(checkInTime).getTime();
      const now = serverTime ? new Date(serverTime).getTime() : Date.now();
      initialElapsed = Math.max(0, Math.floor((now - checkIn) / 1000));
    }

    setElapsed(initialElapsed);

    // Tick every second
    const startedAt = Date.now();
    intervalRef.current = setInterval(() => {
      const tickDelta = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(initialElapsed + tickDelta);
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkInTime, serverDurationSeconds, serverTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n) => String(n).padStart(2, '0');

  // Color transitions based on hours worked
  let timerColor = 'text-primary-700';
  let bgColor = 'bg-primary-50';
  let borderColor = 'border-primary-200';
  let pulseColor = 'bg-primary-500';
  
  if (hours >= 8) {
    timerColor = 'text-success-700';
    bgColor = 'bg-success-50';
    borderColor = 'border-success-200';
    pulseColor = 'bg-success-500';
  } else if (hours >= 4) {
    timerColor = 'text-info-700';
    bgColor = 'bg-info-50';
    borderColor = 'border-info-200';
    pulseColor = 'bg-info-500';
  }

  return (
    <div className={`${bgColor} ${borderColor} border rounded-xl p-4 sm:p-5`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseColor} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-3 w-3 ${pulseColor}`}></span>
        </div>
        <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Working Time</span>
      </div>
      <div className={`font-mono text-3xl sm:text-4xl font-bold ${timerColor} tracking-wider tabular-nums`}>
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </div>
      <p className="text-xs text-slate-400 mt-1">
        {hours >= 8 ? '✓ Full day completed' : hours >= 4 ? 'Half day reached' : 'Session active'}
      </p>
    </div>
  );
}
