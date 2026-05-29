import Link from 'next/link';
import Button from '@/components/common/Button';

export default function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  breadcrumbs,
  tabs,
  children 
}) {
  return (
    <header className="page-header sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex mb-3" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 text-slate-300 mx-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-slate-500 hover:text-slate-900 transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle mt-1">{subtitle}</p>}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Tabs */}
        {tabs && tabs.length > 0 && (
          <nav className="mt-4 flex gap-2 border-t border-slate-200 pt-4 overflow-x-auto scrollbar-thin">
            {tabs.map((tab, index) => (
              <Link key={index} href={tab.href}>
                <Button 
                  variant={tab.active ? 'primary' : 'ghost'} 
                  size="sm"
                  icon={tab.icon}
                >
                  {tab.label}
                </Button>
              </Link>
            ))}
          </nav>
        )}

        {/* Custom children */}
        {children}
      </div>
    </header>
  );
}
