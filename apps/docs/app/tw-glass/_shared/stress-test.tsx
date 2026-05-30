"use client";

/**
 * Shared scaffolding for the tw-glass stress-test pages
 * (`stress-test/` and `stress-test-text/`).
 *
 * These presentational components and the FPS hook were previously duplicated —
 * mostly byte-identical — across both page files. `TableOfContents` is the only
 * one that varied, and only in its data, so it now takes a `sections` prop.
 */
import { cn } from "@/lib/utils";
import { useState, useEffect, type ReactNode } from "react";

export function TableOfContents({
  sections,
}: {
  sections: { id: string; label: string }[];
}) {
  return (
    <nav className="sticky top-24">
      <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
        Sections
      </h2>
      <ul className="space-y-1">
        {sections.map(({ id, label }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className="text-muted-foreground hover:bg-muted hover:text-foreground block rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        {description && <p className="text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

export function TestCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 overflow-x-auto rounded-lg border border-dashed p-4">
      <div>
        <h3 className="font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function useFps() {
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    function tick() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return fps;
}

export function FpsCounter() {
  const fps = useFps();
  return (
    <div className="bg-background/80 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm">
      <span
        className={cn("size-2 rounded-full", {
          "bg-green-500": fps >= 55,
          "bg-yellow-500": fps >= 30,
          "bg-red-500": fps < 30,
        })}
      />
      {fps} FPS
    </div>
  );
}

export function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div className="space-y-2">
      <label
        className="flex items-center justify-between text-sm font-medium"
        htmlFor={id}
      >
        <span>{label}</span>
        <span className="text-muted-foreground font-mono">{display}</span>
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}
