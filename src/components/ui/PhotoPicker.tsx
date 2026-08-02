"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { uploads } from "@/config/uploads";
import { compressImage, formatBytes, isSupportedImage } from "@/lib/image";
import { cn } from "@/lib/cn";
import type { BookingPhoto } from "@/types";

interface Props {
  label: string;
  hint?: string;
  value: BookingPhoto[];
  onChange: (photos: BookingPhoto[]) => void;
  error?: string;
}

/**
 * Выбор фото-референсов.
 *
 * Мобильные решения:
 *  - без атрибута capture: iOS сам покажет выбор «Медиатека / Снять фото»,
 *    а capture="environment" отрезал бы галерею — а именно оттуда обычно
 *    берут скриншот причёски из инстаграма;
 *  - сжатие идёт сразу после выбора, поэтому на медленной сети ждать нечего;
 *  - превью 88×88 в ленте: три фото помещаются на экран любого телефона;
 *  - кнопка удаления 32px в углу — палец попадает, но не мешает смотреть фото.
 */
export function PhotoPicker({ label, hint, value, onChange, error }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const full = value.length >= uploads.maxFiles;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setLocalError(null);

    const free = uploads.maxFiles - value.length;
    const picked = Array.from(fileList).slice(0, free);

    if (Array.from(fileList).length > free) {
      setLocalError(`Можно приложить не больше ${uploads.maxFiles} фото`);
    }

    setBusy(true);
    const next: BookingPhoto[] = [];

    for (const file of picked) {
      if (!isSupportedImage(file)) {
        setLocalError("Подойдут только изображения");
        continue;
      }
      try {
        const photo = await compressImage(file);
        if (photo.size > uploads.maxBytes) {
          setLocalError("Фото слишком тяжёлое даже после сжатия");
          continue;
        }
        next.push(photo);
      } catch {
        setLocalError("Не удалось обработать фото. Попробуйте другое");
      }
    }

    setBusy(false);
    if (next.length) onChange([...value, ...next]);

    // сброс — иначе повторный выбор того же файла не вызовет change
    if (inputRef.current) inputRef.current.value = "";
  }

  const shownError = error ?? localError;

  return (
    <div className="w-full">
      <label className="mb-2 block text-sm text-muted">{label}</label>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence initial={false}>
          {value.map((photo) => (
            <motion.div
              key={photo.id}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-[88px] w-[88px] overflow-hidden rounded-control border border-line bg-surface"
            >
              {/* обычный img: это локальный data-URL, next/image здесь не нужен */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.dataUrl} alt={photo.name} className="h-full w-full object-cover" />

              <button
                type="button"
                onClick={() => onChange(value.filter((p) => p.id !== photo.id))}
                aria-label={`Убрать фото ${photo.name}`}
                className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-pill bg-black/55 text-white backdrop-blur-sm transition-colors active:bg-black/75"
              >
                <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden>
                  <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>

              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-3 text-[10px] tabular-nums text-white">
                {formatBytes(photo.size)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {!full && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className={cn(
              "flex h-[88px] w-[88px] flex-col items-center justify-center gap-1.5 rounded-control",
              "border border-dashed border-line bg-elevated text-muted",
              "transition-colors duration-200 ease-soft active:bg-surface disabled:opacity-50",
            )}
          >
            {busy ? (
              <span
                aria-hidden
                className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"
              />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path
                  d="M4 17V8.5a1.5 1.5 0 011.5-1.5h2L9 5h6l1.5 2h2A1.5 1.5 0 0120 8.5V17a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12.5" r="3" fill="none" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            )}
            <span className="text-xs">{busy ? "Готовим" : "Добавить"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={uploads.accept}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {shownError ? (
        <p className="mt-2 text-sm text-red-500">{shownError}</p>
      ) : hint ? (
        <p className="mt-2 text-sm text-muted">{hint}</p>
      ) : null}
    </div>
  );
}