"use client";

import { useId, useState } from "react";

/** Password field with a show/hide toggle (fewer typos on phones). */
export function PasswordInput({
  label,
  value,
  onChange,
  autoComplete,
  name,
  invalid,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete: "current-password" | "new-password";
  name: string;
  invalid?: boolean;
}) {
  const [shown, setShown] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="font-bold">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={id}
          type={shown ? "text" : "password"}
          name={name}
          autoComplete={autoComplete}
          required
          maxLength={200}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid || undefined}
          className="block w-full rounded-lg border-2 border-ink/30 bg-white py-2.5 pr-16 pl-3 focus:border-rose"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute inset-y-0 right-0 px-3 text-sm font-bold text-ink-soft hover:text-ink"
          aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={shown}
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
