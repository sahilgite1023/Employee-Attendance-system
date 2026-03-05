import { useState } from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  required = false,
  className = '',
  helpText,
  icon,
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
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">{icon}</span>
          </div>
        )}
        <input
          type={inputType}
          className={`input ${error ? 'input-error' : ''} ${icon ? 'pl-10' : ''} ${isPasswordField ? 'pr-12' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${props.name}-error` : helpText ? `${props.name}-help` : undefined}
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
        <p id={`${props.name}-error`} className="mt-1.5 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      {helpText && !error && (
        <p id={`${props.name}-help`} className="mt-1.5 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
}
