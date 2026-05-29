export default function Card({
  children,
  title,
  subtitle,
  hover = false,
  interactive = false,
  className = '',
  headerAction,
  noPadding = false,
  ...props
}) {
  const hoverClass = hover ? 'card-hover' : '';
  const interactiveClass = interactive ? 'card-interactive' : '';
  const paddingClass = noPadding ? 'p-0' : 'p-6';

  return (
    <div 
      className={`card ${hoverClass} ${interactiveClass} ${paddingClass} ${className}`} 
      {...props}
    >
      {(title || headerAction) && (
        <div className={`flex items-start justify-between ${!noPadding ? 'mb-4' : 'p-6 pb-4 border-b border-slate-100'}`}>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
            )}
          </div>
          {headerAction && (
            <div className="ml-4 flex-shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className={!noPadding && (title || headerAction) ? '' : noPadding ? 'p-6 pt-0' : ''}>
        {children}
      </div>
    </div>
  );
}
