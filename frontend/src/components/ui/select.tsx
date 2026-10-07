"use client";

import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, AlertCircle } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  emptyMessage?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      options,
      placeholder,
      emptyMessage = "No options available",
      id,
      disabled,
      value,
      defaultValue,
      onChange,
      name,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);
    const isEmpty = options.length === 0;
    const isDisabled = disabled || isEmpty;

    // Local state for custom popover selection
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState<string>(
      (value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : options[0]?.value) || ""
    );

    const containerRef = useRef<HTMLDivElement>(null);
    const hiddenSelectRef = useRef<HTMLSelectElement | null>(null);

    // Keep internal state in sync with controlled value prop
    useEffect(() => {
      if (value !== undefined) {
        setSelectedValue(String(value));
      }
    }, [value]);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }, [isOpen]);

    const handleSelectOption = (optValue: string) => {
      setSelectedValue(optValue);
      setIsOpen(false);

      if (hiddenSelectRef.current) {
        hiddenSelectRef.current.value = optValue;
        // Trigger React Hook Form onChange
        const event = new Event("change", { bubbles: true });
        hiddenSelectRef.current.dispatchEvent(event);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: optValue, name },
          currentTarget: { value: optValue, name },
        } as unknown as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    const currentOption = options.find((o) => o.value === selectedValue);
    const displayLabel = currentOption
      ? currentOption.label
      : placeholder || (isEmpty ? emptyMessage : options[0]?.label || "Select...");

    return (
      <div className="w-full space-y-1.5" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-wide"
            style={{ color: "var(--text-primary)" }}
          >
            {label}
          </label>
        )}

        {/* Hidden native select to integrate with react-hook-form ref and form submission */}
        <select
          ref={(node) => {
            hiddenSelectRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLSelectElement | null>).current = node;
            }
          }}
          id={inputId}
          name={name}
          value={selectedValue}
          disabled={isDisabled}
          onChange={(e) => {
            setSelectedValue(e.target.value);
            if (onChange) onChange(e);
          }}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Themed Interactive Trigger Button */}
        <div className="relative">
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => !isDisabled && setIsOpen(!isOpen)}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-xl border px-3.5 py-2 text-sm text-left font-medium",
              "transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[var(--accent-shadow)] focus:border-[var(--accent)]",
              isDisabled
                ? "cursor-not-allowed opacity-60 border-dashed"
                : "cursor-pointer hover:border-[var(--border-hover)] active:scale-[0.99]",
              error
                ? "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                : "",
              className
            )}
            style={{
              background: "var(--bg-elevated)",
              borderColor: error
                ? undefined
                : isDisabled
                ? "var(--border-subtle)"
                : "var(--border-default)",
              color: isEmpty ? "var(--text-muted)" : "var(--text-primary)",
              boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
            }}
          >
            <span className="truncate pr-2">{displayLabel}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                isOpen && "rotate-180",
                isDisabled ? "opacity-30" : "opacity-70"
              )}
              style={{ color: "var(--text-muted)" }}
            />
          </button>

          {/* Custom Dropdown Menu: Light mode stays 100% clean light, Dark mode stays pure dark */}
          {isOpen && !isDisabled && (
            <div
              role="listbox"
              className="absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border p-1 shadow-2xl animate-scaleUp focus:outline-none"
              style={{
                background: "var(--bg-surface)",
                borderColor: "var(--border-default)",
                boxShadow: "0 12px 32px -4px rgba(0, 0, 0, 0.18), 0 4px 12px -2px rgba(0, 0, 0, 0.08)",
              }}
            >
              {options.map((opt) => {
                const isSelected = opt.value === selectedValue;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={opt.disabled}
                    onClick={() => handleSelectOption(opt.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors text-left",
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "cursor-pointer hover:bg-[var(--bg-elevated)]"
                    )}
                    style={{
                      background: isSelected ? "var(--accent-subtle)" : "transparent",
                      color: isSelected ? "var(--accent)" : "var(--text-primary)",
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 ml-2 text-[var(--accent)]" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty list notice */}
        {isEmpty && !error && (
          <div
            className="flex items-center gap-1.5 text-[11px] pt-0.5 animate-fadeIn"
            style={{ color: "var(--text-muted)" }}
          >
            <AlertCircle className="h-3 w-3 shrink-0 opacity-75" />
            <span>{emptyMessage}</span>
          </div>
        )}

        {error && (
          <p className="text-xs text-rose-500 font-medium animate-fadeIn">{error}</p>
        )}
        {helperText && !error && !isEmpty && (
          <p
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
