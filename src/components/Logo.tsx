import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showText = true,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="relative flex-shrink-0 flex items-center justify-center rounded-xl overflow-hidden shadow-xs"
      >
        {!imageError ? (
          <img
            src="/logo.png"
            alt="COGAVA Logo"
            onError={() => setImageError(true)}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 flex items-center justify-center text-white p-1.5 shadow-md shadow-orange-500/20">
            {/* Stylized rooster SVG fallback */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-full text-white"
            >
              {/* Rooster Comb */}
              <path
                d="M20 9C19 6 22 4 25 5C27 2 31 3 32 6C34 5 36 7 35 9C34 11 31 12 28 12C24 12 21 11 20 9Z"
                fill="#FFF"
                opacity="0.95"
              />
              {/* Head & Arching Neck */}
              <path
                d="M22 11C27 10 33 13 33 19C33 24 29 27 29 32C29 36 26 39 21 40C16 41 12 37 12 32C12 27 16 23 18 19C19 16 20 13 22 11Z"
                fill="#FFF"
              />
              {/* Rooster Beak */}
              <path d="M33 15L40 18L33 21Z" fill="#FED7AA" />
              {/* Wattle */}
              <path
                d="M31 22C33 23 33 26 31 28C29 28 29 24 31 22Z"
                fill="#EF4444"
              />
              {/* Rooster Eye */}
              <circle cx="28" cy="16" r="1.5" fill="#C2410C" />
              {/* Tail Feathers */}
              <path
                d="M14 26C10 24 6 20 7 14C10 17 12 21 15 24Z"
                fill="#FFF"
                opacity="0.8"
              />
              <path
                d="M12 30C7 28 4 23 4 17C8 20 10 25 13 28Z"
                fill="#FFF"
                opacity="0.6"
              />
              {/* Wing */}
              <path
                d="M18 24C21 24 24 27 24 31C24 34 21 36 17 35C16 32 16 27 18 24Z"
                fill="#EA580C"
              />
            </svg>
          </div>
        )}
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-black tracking-tight text-xl text-stone-900 leading-none">
              COGAVA
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200/60">
              Chấm công
            </span>
          </div>
          <span className="text-xs text-stone-500 font-medium tracking-tight">
            Dịch vụ bắt gà chuyên nghiệp
          </span>
        </div>
      )}
    </div>
  );
};
