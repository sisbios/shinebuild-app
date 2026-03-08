interface AppLogoProps {
  size?: number;
  className?: string;
  rounded?: 'xl' | '2xl' | 'full';
}

export function AppLogo({ size = 36, className = '', rounded = 'xl' }: AppLogoProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : rounded === '2xl' ? 'rounded-2xl' : 'rounded-xl';
  return (
    <img
      src="/icons/logo-96.png"
      alt="Shine Build Hub"
      width={size}
      height={size}
      className={`${roundedClass} object-cover flex-shrink-0 ${className}`}
    />
  );
}
