"use client";

import { cn } from "@/lib/utils/cn";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}

/**
 * Single field geometry. py-4 yields 56px height, matching primary buttons
 * for visual consistency across forms.
 */
const control =
  "w-full rounded-control border bg-elevated px-4 py-4 text-ink placeholder:text-muted/60 " +
  "transition-colors duration-200 ease-soft outline-none focus:border-ink " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(control, error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={cn(control, "resize-none", error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
