"use client";

import { cn } from "@/lib/cn";

interface BaseProps {
  label: string;
  error?: string;
  hint?: string;
  id: string;
}

/**
 * Единая геометрия полей. py-4 вместо 3.5 даёт высоту 56px —
 * столько же, сколько у главной кнопки, и форма перестаёт
 * выглядеть собранной из разных наборов.
 */
const control =
  "w-full rounded-control border bg-elevated px-4 py-4 text-ink placeholder:text-muted/60 " +
  "transition-colors duration-200 ease-soft outline-none focus:border-ink";

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-500">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  id,
  className,
  ...rest
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm text-muted">
        {label}
      </label>
      <textarea
        id={id}
        rows={3}
        className={cn(control, "resize-none", error ? "border-red-400" : "border-line", className)}
        {...rest}
      />
    </div>
  );
}
