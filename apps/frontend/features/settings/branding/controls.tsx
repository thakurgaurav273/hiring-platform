"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { isHexColor } from "@/lib/theme/color";
import { cn } from "@/lib/utils";

// Theme controls shared by Settings → Branding & Appearance and the public
// website's brand playground.

export function ColorField({
  id,
  label,
  help,
  value,
  fallback,
  onChange,
  adjusted,
}: {
  id: string;
  label: string;
  help: string;
  value: string | null;
  fallback: string;
  onChange: (value: string | null) => void;
  adjusted?: string;
}) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => setText(value ?? ""), [value]);
  const shown = value ?? fallback;
  const invalid = text !== "" && !isHexColor(text);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={id} className="text-[12.5px] font-medium">
          {label}
        </label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-[11.5px] font-medium text-muted-foreground hover:text-foreground"
          >
            Use preset
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} picker`}
          value={shown.toLowerCase()}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-[var(--radius-control)] border border-border bg-surface p-1"
        />
        <input
          id={id}
          className="input font-mono uppercase"
          value={text}
          placeholder={`${fallback} (preset)`}
          maxLength={7}
          aria-invalid={invalid}
          aria-describedby={`${id}-help`}
          onChange={(e) => {
            const next = e.target.value.trim();
            const normalized = next && !next.startsWith("#") ? `#${next}` : next;
            setText(normalized);
            if (normalized === "") onChange(null);
            else if (isHexColor(normalized)) onChange(normalized.toUpperCase());
          }}
        />
      </div>
      <p id={`${id}-help`} className={cn("mt-1.5 text-[11.5px]", invalid ? "text-destructive" : "text-muted-foreground")}>
        {invalid ? "Enter a 6-digit HEX colour, e.g. #4F46E5." : help}
      </p>
      {adjusted && !invalid && (
        <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] text-muted-foreground">
          <Info className="mt-px h-3.5 w-3.5 shrink-0 text-info" aria-hidden="true" />
          <span>
            Shown as <span className="font-mono text-foreground">{adjusted}</span> on light backgrounds so text stays
            readable (WCAG AA).
          </span>
        </p>
      )}
    </div>
  );
}

export function OptionGroup<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string; hint?: string; radius?: number; fontVar?: string }[];
}) {
  return (
    <div>
      <div className="mb-1.5 text-[12.5px] font-medium">{label}</div>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-3 gap-2">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex flex-col items-start rounded-md border px-3 py-2 text-left transition",
                active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-border-strong"
              )}
            >
              <span className="flex items-center gap-2 text-[13px] font-medium" style={o.fontVar ? { fontFamily: o.fontVar } : undefined}>
                {o.radius !== undefined && (
                  <span
                    aria-hidden="true"
                    className="h-3.5 w-3.5 border-2 border-current border-b-0 border-r-0"
                    style={{ borderTopLeftRadius: o.radius }}
                  />
                )}
                {o.label}
              </span>
              {o.hint && <span className="text-[11px] text-muted-foreground">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
