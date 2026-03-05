'use client';

import { useState, useEffect } from 'react';

export default function LiveClock({ className = '' }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className={`text-center ${className}`}>
      <div className="text-3xl sm:text-4xl font-bold text-primary-700 tabular-nums tracking-tight">
        {formattedTime}
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {formattedDate}
      </div>
    </div>
  );
}
