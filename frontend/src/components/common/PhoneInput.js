'use client';

import { useState } from 'react';

const countries = [
  { code: '+1', country: 'US', flag: '🇺🇸', name: 'United States' },
  { code: '+1', country: 'CA', flag: '🇨🇦', name: 'Canada' },
  { code: '+44', country: 'GB', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'UAE' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
];

export default function PhoneInput({ 
  label = 'Phone', 
  value = '', 
  onChange, 
  error, 
  disabled = false,
  required = false 
}) {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Parse initial value if provided
  useState(() => {
    if (value) {
      const country = countries.find(c => value.startsWith(c.code));
      if (country) {
        setCountryCode(country.code);
        setPhoneNumber(value.substring(country.code.length).trim());
      } else {
        setPhoneNumber(value);
      }
    }
  }, []);

  const handleCountryChange = (code) => {
    setCountryCode(code);
    setIsDropdownOpen(false);
    const fullNumber = phoneNumber ? `${code} ${phoneNumber}` : code;
    onChange?.({ target: { value: fullNumber } });
  };

  const handlePhoneChange = (e) => {
    const number = e.target.value.replace(/[^0-9]/g, '');
    setPhoneNumber(number);
    const fullNumber = number ? `${countryCode} ${number}` : '';
    onChange?.({ target: { value: fullNumber } });
  };

  const selectedCountry = countries.find(c => c.code === countryCode) || countries[3];

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex">
        {/* Country Code Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
            disabled={disabled}
            className={`h-full px-3 py-2 border border-r-0 border-gray-300 rounded-l-lg bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 min-w-[100px] ${
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <span className="text-xl">{selectedCountry.flag}</span>
            <span className="text-sm font-medium">{countryCode}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute z-20 mt-1 w-64 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {countries.map((country, index) => (
                  <button
                    key={`${country.code}-${country.country}-${index}`}
                    type="button"
                    onClick={() => handleCountryChange(country.code)}
                    className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center gap-2 text-sm"
                  >
                    <span className="text-xl">{country.flag}</span>
                    <span className="font-medium">{country.code}</span>
                    <span className="text-gray-600">{country.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Phone Number Input */}
        <input
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          disabled={disabled}
          placeholder="Enter phone number"
          className={`flex-1 px-3 py-2 border rounded-r-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
        />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
