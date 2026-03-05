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
      bg: 'bg-primary-100',
      icon: 'text-primary-600',
    },
    success: {
      text: 'text-success-600',
      bg: 'bg-success-100',
      icon: 'text-success-600',
    },
    warning: {
      text: 'text-warning-600',
      bg: 'bg-warning-100',
      icon: 'text-warning-600',
    },
    danger: {
      text: 'text-danger-600',
      bg: 'bg-danger-100',
      icon: 'text-danger-600',
    },
    info: {
      text: 'text-info-600',
      bg: 'bg-info-100',
      icon: 'text-info-600',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className="card hover:shadow-card-hover transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-3xl font-bold ${colors.text} mb-1`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
          {trend !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {trend >= 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                )}
              </svg>
              <span className="font-medium">{Math.abs(trend)}%</span>
              {trendLabel && <span className="text-gray-500">{trendLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            <div className={colors.icon}>
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
