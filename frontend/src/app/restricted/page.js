'use client';

export default function RestrictedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-card-lg p-8 sm:p-10">
          {/* Lock Icon */}
          <div className="mx-auto w-20 h-20 bg-danger-50 ring-1 ring-inset ring-danger-100 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-3">Access Restricted</h1>

          <p className="text-slate-500 mb-6">
            This application is only accessible from the office network.
            Please connect to the office Wi-Fi or VPN to access the system.
          </p>

          <div className="bg-primary-50 ring-1 ring-inset ring-primary-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-primary-800">
              <strong>Security Check:</strong> Your IP address is not recognized as part of the authorized network.
            </p>
          </div>

          <div className="text-left bg-slate-50 ring-1 ring-inset ring-slate-100 rounded-xl p-4">
            <h3 className="font-semibold text-slate-900 mb-3">To gain access:</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              {[
                'Connect to the office network',
                'Use the company VPN if working remotely',
                'Contact IT support if you believe this is an error',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-primary-500 mt-0.5 flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                    </svg>
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400">
              Need help? Contact IT Support at{' '}
              <a href="mailto:it@company.com" className="text-primary-600 hover:underline">
                it@company.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
