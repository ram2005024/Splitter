import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost" | "link";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 select-none rounded-xl cursor-pointer";

    const variants: Record<string, React.CSSProperties> = {
      primary:   {},
      secondary: {},
      outline:   {},
      danger:    {},
      ghost:     {},
      link:      {},
    };

    const variantClasses: Record<string, string> = {
      primary:   "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] active:scale-[0.98] shadow-md border border-white/10",
      secondary: "bg-[var(--bg-elevated)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)] border border-[var(--border-default)]",
      outline:   "bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)]",
      danger:    "bg-rose-600 text-white hover:bg-rose-500 active:scale-[0.98] shadow-md border border-rose-500/20",
      ghost:     "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]",
      link:      "bg-transparent text-[var(--text-link)] hover:text-[var(--accent)] underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      sm:   "h-9 px-3 text-xs gap-1.5",
      md:   "h-10 px-4 text-sm gap-2",
      lg:   "h-12 px-6 text-base gap-2.5",
      icon: "h-10 w-10 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantClasses[variant], sizes[size], className)}
        style={{ ...variants[variant], ...style }}
        {...props}
      >
        {isLoading && (
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
