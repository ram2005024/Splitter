import React from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LogoIcon({ className, size = "md", ...props }: LogoIconProps) {
  const sizeClasses = {
    sm: "h-7 w-7",
    md: "h-9 w-9",
    lg: "h-11 w-11",
  };

  return (
    <div
      className={cn(
        "relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 text-white shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 select-none shrink-0",
        sizeClasses[size],
        className
      )}
      style={{
        boxShadow: "0 4px 14px var(--accent-shadow), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 drop-shadow-sm"
        {...props}
      >
        {/* Modern geometric stylized S monogram */}
        <path
          d="M17.5 7.5C17.5 5.567 15.261 4 12.5 4C9.739 4 7.5 5.567 7.5 7.5C7.5 10.5 16.5 9.5 16.5 13.5C16.5 15.985 14.71 18 12 18C9.29 18 7.5 16.2 7.5 14.5"
          stroke="currentColor"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="17.5" cy="7.5" r="1.25" fill="currentColor" />
        <circle cx="7.5" cy="14.5" r="1.25" fill="currentColor" />
      </svg>
    </div>
  );
}
