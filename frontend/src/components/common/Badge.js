import { getStatusBadgeClass, getStatusText } from '@/lib/utils';

export default function Badge({ status, text, variant, className = '' }) {
  if (!status && !text && !variant) {
    return <span className="text-gray-400 text-sm">-</span>;
  }
  
  const displayText = text || getStatusText(status);
  const badgeClass = variant ? `badge-${variant}` : getStatusBadgeClass(status);

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {displayText}
    </span>
  );
}
