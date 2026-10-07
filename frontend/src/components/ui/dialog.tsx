"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React, { useEffect } from "react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Invisible backdrop - only used to detect outside clicks */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-scaleUp",
          className,
        )}
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-default)",
          color: "var(--text-primary)",
          boxShadow:
            "0 24px 64px -8px rgba(0, 0, 0, 0.8), 0 4px 16px -4px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between pb-4 mb-5 border-b"
          style={{
            borderColor: "var(--border-subtle)",
          }}
        >
          <div>
            <h3
              id="dialog-title"
              className="text-base font-semibold tracking-tight"
              style={{
                color: "var(--text-primary)",
              }}
            >
              {title}
            </h3>

            {description && (
              <p
                id="dialog-description"
                className="mt-1 text-xs leading-relaxed"
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--bg-muted)] cursor-pointer"
            style={{
              color: "var(--text-muted)",
            }}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  );
}
