interface LinkzLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-xl',
  md: 'text-2xl',
  lg: 'text-4xl',
};

export function LinkzLogo({ className = '', size = 'md' }: LinkzLogoProps) {
  return (
    <div className={`inline-flex flex-col items-start leading-none ${className}`}>
      <span className={`font-bold tracking-tight ${sizes[size]}`}>
        <span className="text-white">Link</span>
        <span className="text-linkz-green">z</span>
      </span>
      <svg
        viewBox="0 0 80 12"
        className={`${size === 'lg' ? 'w-24' : size === 'md' ? 'w-16' : 'w-12'} h-2 -mt-0.5`}
        aria-hidden
      >
        <path
          d="M4 8 Q40 14 76 8"
          fill="none"
          stroke="#589c7f"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function LinkzLogoImage({ className = '' }: { className?: string }) {
  return (
    <img
      src="/linkz-logo.png"
      alt="Linkz"
      className={`h-8 object-contain ${className}`}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
