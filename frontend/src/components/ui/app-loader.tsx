"use client";

import React from "react";

/**
 * Full-screen application loader shown during auth initialization.
 * Features a branded "S" mark, animated ring, progress dots,
 * and a developer credit for Cyrus AKA. Ram Sharma.
 */
export function AppLoader() {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "var(--bg-app)" }}
      aria-label="Loading application"
      role="status"
    >
      {/* ── Brand mark ── */}
      <div className="loader-brand">
        {/* Outer animated ring */}
        <div className="loader-ring" />

        {/* S monogram */}
        <div className="loader-monogram">
          <span>S</span>
        </div>
      </div>

      {/* ── App name ── */}
      <p className="loader-appname">Splitter</p>

      {/* ── Progress dots ── */}
      <div className="loader-dots" aria-hidden="true">
        <span className="loader-dot" style={{ animationDelay: "0ms" }} />
        <span className="loader-dot" style={{ animationDelay: "160ms" }} />
        <span className="loader-dot" style={{ animationDelay: "320ms" }} />
      </div>

      {/* ── Developer credit ── */}
      <div className="loader-credit">
        <span className="loader-credit-name">Created by Cyrus</span>
      </div>
    </div>
  );
}
