export default function Card({
  children,
  title,
  subtitle,
  hover = false,
  className = '',
  ...props
}) {
  const hoverClass = hover ? 'card-hover cursor-pointer' : '';

  return (
    <div className={`card ${hoverClass} ${className}`} {...props}>
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
