"use client";

import { useId, useState } from "react";

export type PasswordRevealFieldProps = {
  id?: string;
  label: React.ReactNode;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  hint?: React.ReactNode;
  disabled?: boolean;
};

function EyeOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={12} cy={12} r={3.25} />
    </svg>
  );
}

function EyeSlashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden {...props}>
      <path
        d="M3 3l18 18M10.73 10.73a3 3 0 014.53 4.53M9.88 9.88A10.94 10.94 0 012 12s3.5 7 10 7a10.94 10.94 0 004.93-1M14.12 14.12A10.93 10.93 0 0122 12s-3.5-7-10-7a10.93 10.93 0 00-5.53 1.55"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PasswordRevealField({
  id: idProp,
  label,
  autoComplete,
  value,
  onChange,
  required,
  hint,
  disabled,
}: PasswordRevealFieldProps) {
  const uid = useId();
  const inputId = idProp ?? `password-${uid.replace(/:/g, "")}`;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label className="text-sm font-medium text-brand-900" htmlFor={inputId}>
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="block min-h-[48px] w-full rounded-xl border border-brand-200 py-3 pl-4 pr-12 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
        />
        <button
          type="button"
          disabled={disabled}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-brand-500 transition hover:text-brand-800 disabled:pointer-events-none disabled:opacity-40"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeSlashIcon className="h-5 w-5" /> : <EyeOpenIcon className="h-5 w-5" />}
        </button>
      </div>
      {hint ?? null}
    </div>
  );
}
