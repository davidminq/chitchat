import { forwardRef, useMemo } from "react";

const Button = forwardRef(({ className = "", size = "default", children, ...props }, ref) => {
  // Memoize size classes to prevent recreation
  const sizeClasses = useMemo(() => ({
    default: "px-4 py-2 text-sm",
    sm: "px-3 py-1.5 text-xs", 
    lg: "px-6 py-3 text-base"
  }), []);

  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  // Memoize combined classes
  const combinedClasses = useMemo(() => 
    `${baseClasses} ${sizeClasses[size] || sizeClasses.default} ${className}`,
    [baseClasses, sizeClasses, size, className]
  );

  return (
    <button
      className={combinedClasses}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button };