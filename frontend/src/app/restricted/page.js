'use client';

export default function RestrictedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-card p-8">
          {/* Lock Icon */}
          <div className="mx-auto w-20 h-20 bg-danger-100 rounded-full flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-danger-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Restricted
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            This application is only accessible from the office network.
            Please connect to the office Wi-Fi or VPN to access the system.
          </p>

          {/* Info Box */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-primary-800">
              <strong>Security Check:</strong> Your IP address is not recognized as part of the authorized network.
            </p>
          </div>

          {/* Instructions */}
          <div className="text-left bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">
              To gain access:
            </h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Connect to the office network</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Use the company VPN if working remotely</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 mr-2">•</span>
                <span>Contact IT support if you believe this is an error</span>
              </li>
            </ul>
          </div>

          {/* Contact Support */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
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
