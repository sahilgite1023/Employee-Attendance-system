export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  trend, 
  trendLabel,
  color = 'primary' 
}) {
  const colorClasses = {
    primary: {
      text: 'text-primary-600',
      bg: 'bg-primary-50',
      icon: 'text-primary-600',
      ring: 'ring-primary-100',
    },
    success: {
      text: 'text-success-600',
      bg: 'bg-success-50',
      icon: 'text-success-600',
      ring: 'ring-success-100',
    },
    warning: {
      text: 'text-warning-600',
      bg: 'bg-warning-50',
      icon: 'text-warning-600',
      ring: 'ring-warning-100',
    },
    danger: {
      text: 'text-danger-600',
      bg: 'bg-danger-50',
      icon: 'text-danger-600',
      ring: 'ring-danger-100',
    },
    info: {
      text: 'text-info-600',
      bg: 'bg-info-50',
      icon: 'text-info-600',
      ring: 'ring-info-100',
    },
  };

  const colors = colorClasses[color] || colorClasses.primary;

  return (
    <div className="card card-hover group">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colors.text} mb-1 tabular-nums tracking-tight`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {trend >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
              <span className="tabular-nums">{Math.abs(trend)}%</span>
              {trendLabel && <span className="text-slate-400 font-normal">{trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${colors.bg} ring-1 ring-inset ${colors.ring} rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
