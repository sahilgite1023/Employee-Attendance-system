import { getStatusBadgeClass, getStatusText } from '@/lib/utils';

const VALID_VARIANTS = ['success', 'warning', 'danger', 'info', 'primary', 'gray'];

export default function Badge({ status, text, variant, className = '', children }) {
  if (!status && !text && !variant && !children) {
    return <span className="text-gray-400 text-sm">-</span>;
  }
  
  // Determine display text: children > text > getStatusText
  const displayText = children || text || getStatusText(status || variant);
  
  // Determine class: if variant is a known badge color use it directly,
  // otherwise treat it as a status string and resolve through getStatusBadgeClass
  let badgeClass;
  if (variant && VALID_VARIANTS.includes(variant)) {
    badgeClass = `badge-${variant}`;
  } else {
    badgeClass = getStatusBadgeClass(status || variant);
  }

  return (
    <span className={`badge ${badgeClass} ${className}`}>
      {displayText}
    </span>
  );
}
