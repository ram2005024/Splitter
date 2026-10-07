import React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
}

export function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info:    <Info className="h-5 w-5 text-indigo-500 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />,
    error:   <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />,
  };

  const variants = {
    info:    "bg-indigo-500/10 border-indigo-500/30",
    success: "bg-emerald-500/10 border-emerald-500/30",
    warning: "bg-amber-500/10 border-amber-500/30",
    error:   "bg-rose-500/10 border-rose-500/30",
  };

  return (
    <div
      role="alert"
      className={cn(
        "relative flex gap-3 rounded-xl border p-4 text-sm shadow-sm backdrop-blur-sm",
        variants[variant],
        className
      )}
      {...props}
    >
      {icons[variant]}
      <div className="flex-1 space-y-0.5">
        {title && (
          <h5
            className="font-semibold leading-tight"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h5>
        )}
        <div
          className="text-xs leading-relaxed opacity-90"
          style={{ color: "var(--text-secondary)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
