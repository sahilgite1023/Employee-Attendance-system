import { useState } from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  required = false,
  className = '',
  ...props
}) {
  const isPasswordField = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = isPasswordField && isPasswordVisible ? 'text' : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={inputType}
          className={`input ${isPasswordField ? 'pr-12' : ''} ${error ? 'border-danger-500 focus:ring-danger-500' : ''} ${className}`}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            disabled={props.disabled}
          >
            {isPasswordVisible ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-2.157-2.156A9.46 9.46 0 0018.43 10a9.455 9.455 0 00-3.335-3.654A9.454 9.454 0 0010 4.5c-1.426 0-2.779.314-4 .876L3.28 2.22zM10 6a4 4 0 013.997 3.842l-1.726-1.726a2.5 2.5 0 00-3.387-3.387L7.842 3.687A3.986 3.986 0 0110 6zm-4.951.334A7.96 7.96 0 001.57 10a7.96 7.96 0 002.85 2.89l1.1-1.1A4.98 4.98 0 015 10c0-.43.054-.846.155-1.243l-.106-.106zM8.121 9.183a2.5 2.5 0 002.696 2.696l-2.696-2.696z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 4.5c-3.9 0-7.08 2.64-8.43 5.5C2.92 12.86 6.1 15.5 10 15.5s7.08-2.64 8.43-5.5C17.08 7.14 13.9 4.5 10 4.5zm0 9a3.5 3.5 0 110-7 3.5 3.5 0 010 7z" />
                <path d="M10 8a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  );
}
