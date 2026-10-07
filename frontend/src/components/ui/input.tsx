import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"
              style={{ color: "var(--text-muted)" }}
            >
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              "flex h-10 w-full rounded-xl border px-3.5 py-2 text-sm placeholder:opacity-50",
              "transition-colors focus:outline-none focus:ring-1",
              "disabled:cursor-not-allowed disabled:opacity-50",
              icon ? "pl-10" : "",
              error ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500" : "",
              className
            )}
            style={{
              background: "var(--bg-surface)",
              borderColor: error ? undefined : "var(--border-default)",
              color: "var(--text-primary)",
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-rose-500 animate-fadeIn">{error}</p>
        )}
        {helperText && !error && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
