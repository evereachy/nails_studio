"use client";

import { useCallback, useEffect, useState } from "react";
import { services } from "@/config/catalog";
import { weekdayNames, weekdayOrder } from "@/config/schedule";
import { cn } from "@/lib/cn";
import { formatDateLong, formatDuration, formatPrice } from "@/lib/format";
import type { BookingRecord, Master, SalonSettings } from "@/types";

type Tab = "schedule" | "masters" | "bookings";

export default function AdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("schedule");

  useEffect(() => {
    fetch("/api/admin/login")
      .then((r) => r.json())
      .then((j) => setAuthorized(Boolean(j.authorized)))
      .catch(() => setAuthorized(false));
  }, []);

  if (authorized === null) {
    return <Centered>Проверяем доступ…</Centered>;
  }

  if (!authorized) {
    return <LoginForm onSuccess={() => setAuthorized(true)} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl">Управление салоном</h1>
        <button
          onClick={async () => {
            await fetch("/api/admin/login", { method: "DELETE" });
            setAuthorized(false);
          }}
          className="min-h-10 rounded-control border border-line px-3 text-sm text-muted"
        >
          Выйти
        </button>
      </header>

      {/* Вкладки лентой — на телефоне помещаются в одну строку */}
      <div className="rail mb-6">
        {(
          [
            ["schedule", "График"],
            ["masters", "Мастера"],
            ["bookings", "Записи"],
          ] as Array<[Tab, string]>
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "min-h-11 rounded-control border px-4 text-[15px] transition-colors",
              tab === id ? "border-ink bg-accent text-accent-ink" : "border-line bg-elevated",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "bookings" ? <BookingsTab /> : <SettingsTab tab={tab} />}
    </div>
  );
}

/* ------------------------------- Вход ---------------------------------- */

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const json = await res.json();

    setBusy(false);
    if (json.ok) onSuccess();
    else setError(json.error ?? "Не удалось войти");
  }

  return (
    <Centered>
      <div className="w-full max-w-sm rounded-card border border-line bg-elevated p-6">
        <h1 className="mb-1 font-display text-xl">Вход для управляющей</h1>
        <p className="mb-5 text-sm text-muted">График, мастера и записи салона.</p>

        <input
          type="password"
          value={password}
          autoComplete="current-password"
          enterKeyHint="go"
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Пароль"
          className="w-full rounded-control border border-line bg-bg px-4 py-3.5 outline-none focus:border-ink"
        />

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={busy || password.length === 0}
          className="mt-4 min-h-12 w-full rounded-control bg-accent font-medium text-accent-ink disabled:opacity-40"
        >
          {busy ? "Проверяем…" : "Войти"}
        </button>
      </div>
    </Centered>
  );
}

/* --------------------------- График и мастера --------------------------- */

function SettingsTab({ tab }: { tab: Tab }) {
  const [settings, setSettings] = useState<SalonSettings | null>(null);
  const [masters, setMasters] = useState<Master[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setSettings(j.data.settings);
          setMasters(j.data.masters);
        }
      });
  }, []);

  const save = useCallback(async () => {
    if (!settings) return;
    setStatus("Сохраняем…");
    setError(null);

    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings, masters }),
    });
    const json = await res.json();

    if (json.ok) {
      setStatus("Сохранено");
      setDirty(false);
      setTimeout(() => setStatus(null), 2500);
    } else {
      setStatus(null);
      setError(json.error ?? "Не удалось сохранить");
    }
  }, [settings, masters]);

  if (!settings) return <p className="text-muted">Загружаем…</p>;

  const patch = (p: Partial<SalonSettings>) => {
    setSettings({ ...settings, ...p });
    setDirty(true);
  };

  const patchMasters = (next: Master[]) => {
    setMasters(next);
    setDirty(true);
  };

  return (
    <div className="space-y-6">
      {tab === "schedule" && (
        <>
          <Card title="Рабочие часы" hint="Выключенный день пропадёт из календаря на сайте">
            <div className="space-y-2">
              {weekdayOrder.map((wd) => {
                const day = settings.workingHours.find((d) => d.weekday === wd) ?? {
                  weekday: wd,
                  open: null,
                  close: null,
                };
                const isOpen = Boolean(day.open && day.close);

                return (
                  <div
                    key={wd}
                    className="flex flex-wrap items-center gap-2 rounded-control border border-line px-3 py-2.5"
                  >
                    <button
                      onClick={() =>
                        patch({
                          workingHours: settings.workingHours.map((d) =>
                            d.weekday === wd
                              ? isOpen
                                ? { ...d, open: null, close: null }
                                : { ...d, open: "10:00", close: "19:00" }
                              : d,
                          ),
                        })
                      }
                      className={cn(
                        "h-6 w-11 shrink-0 rounded-pill border transition-colors",
                        isOpen ? "border-ink bg-accent" : "border-line bg-surface",
                      )}
                      aria-pressed={isOpen}
                      aria-label={`${weekdayNames[wd]}: ${isOpen ? "рабочий" : "выходной"}`}
                    >
                      <span
                        className={cn(
                          "block h-5 w-5 rounded-pill bg-bg transition-transform",
                          isOpen ? "translate-x-[22px]" : "translate-x-0.5",
                        )}
                      />
                    </button>

                    <span className="min-w-[104px] flex-1 text-[15px]">{weekdayNames[wd]}</span>

                    {isOpen ? (
                      <div className="flex items-center gap-1.5">
                        <TimeInput
                          value={day.open!}
                          onChange={(v) =>
                            patch({
                              workingHours: settings.workingHours.map((d) =>
                                d.weekday === wd ? { ...d, open: v } : d,
                              ),
                            })
                          }
                        />
                        <span className="text-muted">—</span>
                        <TimeInput
                          value={day.close!}
                          onChange={(v) =>
                            patch({
                              workingHours: settings.workingHours.map((d) =>
                                d.weekday === wd ? { ...d, close: v } : d,
                              ),
                            })
                          }
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted">выходной</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card
            title="Разовые выходные"
            hint="Праздники и отпуск. Эти даты закроются, даже если день недели рабочий"
          >
            <div className="mb-3 flex flex-wrap gap-2">
              {settings.closedDates.length === 0 && (
                <p className="text-sm text-muted">Пока ничего не добавлено</p>
              )}
              {settings.closedDates.map((d) => (
                <button
                  key={d}
                  onClick={() =>
                    patch({ closedDates: settings.closedDates.filter((x) => x !== d) })
                  }
                  className="flex min-h-10 items-center gap-2 rounded-pill border border-line px-3 text-sm"
                >
                  {formatDateLong(d)}
                  <span className="text-muted">×</span>
                </button>
              ))}
            </div>

            <input
              type="date"
              className="min-h-12 w-full rounded-control border border-line bg-bg px-3"
              onChange={(e) => {
                const v = e.target.value;
                if (v && !settings.closedDates.includes(v)) {
                  patch({ closedDates: [...settings.closedDates, v].sort() });
                }
                e.target.value = "";
              }}
            />
          </Card>

          <Card title="Сетка записи">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm text-muted">Шаг времени, мин</span>
                <select
                  value={settings.slotStepMin}
                  onChange={(e) => patch({ slotStepMin: Number(e.target.value) })}
                  className="min-h-12 w-full rounded-control border border-line bg-bg px-3"
                >
                  {[15, 30, 60].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-muted">Запись открыта на, дней</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={settings.horizonDays}
                  onChange={(e) => patch({ horizonDays: Number(e.target.value) })}
                  className="min-h-12 w-full rounded-control border border-line bg-bg px-3"
                />
              </label>
            </div>
          </Card>
        </>
      )}

      {tab === "masters" && (
        <Card title="Мастера" hint="Клиент увидит только тех, кто делает все выбранные им процедуры">
          <div className="space-y-3">
            {masters.map((m, idx) => (
              <MasterEditor
                key={m.id}
                master={m}
                onChange={(next) =>
                  patchMasters(masters.map((x, i) => (i === idx ? next : x)))
                }
                onRemove={() => patchMasters(masters.filter((_, i) => i !== idx))}
              />
            ))}
          </div>

          <button
            onClick={() =>
              patchMasters([
                ...masters,
                {
                  id: `m${Date.now().toString(36)}`,
                  name: "",
                  role: "",
                  active: true,
                  serviceIds: [],
                  weekdaysOff: [],
                },
              ])
            }
            className="mt-3 min-h-12 w-full rounded-control border border-dashed border-line text-[15px] text-muted"
          >
            + Добавить мастера
          </button>
        </Card>
      )}

      {/* Кнопка сохранения закреплена внизу: форма длинная, скроллить наверх неудобно */}
      <div className="safe-b fixed inset-x-0 bottom-0 border-t border-line bg-bg/90 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <p className="flex-1 truncate text-sm text-muted">
            {error ? <span className="text-red-500">{error}</span> : (status ?? (dirty ? "Есть несохранённые изменения" : "Всё сохранено"))}
          </p>
          <button
            onClick={save}
            disabled={!dirty}
            className="min-h-12 rounded-control bg-accent px-6 font-medium text-accent-ink disabled:opacity-40"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

function MasterEditor({
  master,
  onChange,
  onRemove,
}: {
  master: Master;
  onChange: (m: Master) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-control border border-line p-3">
      <div className="flex gap-2">
        <input
          value={master.name}
          placeholder="Имя"
          onChange={(e) => onChange({ ...master, name: e.target.value })}
          className="min-h-11 w-full rounded-control border border-line bg-bg px-3"
        />
        <button
          onClick={onRemove}
          aria-label="Удалить мастера"
          className="min-h-11 shrink-0 rounded-control border border-line px-3 text-muted"
        >
          ×
        </button>
      </div>

      <input
        value={master.role}
        placeholder="Специализация"
        onChange={(e) => onChange({ ...master, role: e.target.value })}
        className="mt-2 min-h-11 w-full rounded-control border border-line bg-bg px-3 text-sm"
      />

      <p className="mb-2 mt-4 text-sm text-muted">Услуги — пусто значит все</p>
      <div className="flex flex-wrap gap-1.5">
        {services.map((s) => {
          const on = master.serviceIds.includes(s.id);
          return (
            <button
              key={s.id}
              onClick={() =>
                onChange({
                  ...master,
                  serviceIds: on
                    ? master.serviceIds.filter((x) => x !== s.id)
                    : [...master.serviceIds, s.id],
                })
              }
              className={cn(
                "min-h-10 rounded-pill border px-3 text-sm",
                on ? "border-ink bg-accent text-accent-ink" : "border-line",
              )}
            >
              {s.title}
            </button>
          );
        })}
      </div>

      <p className="mb-2 mt-4 text-sm text-muted">Личные выходные</p>
      <div className="flex flex-wrap gap-1.5">
        {weekdayOrder.map((wd) => {
          const off = master.weekdaysOff.includes(wd);
          return (
            <button
              key={wd}
              onClick={() =>
                onChange({
                  ...master,
                  weekdaysOff: off
                    ? master.weekdaysOff.filter((x) => x !== wd)
                    : [...master.weekdaysOff, wd],
                })
              }
              className={cn(
                "h-10 w-10 rounded-pill border text-sm",
                off ? "border-ink bg-accent text-accent-ink" : "border-line",
              )}
            >
              {weekdayNames[wd].slice(0, 2)}
            </button>
          );
        })}
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={master.active}
          onChange={(e) => onChange({ ...master, active: e.target.checked })}
          className="h-5 w-5"
        />
        Принимает записи
      </label>
    </div>
  );
}

/* ------------------------------- Записи --------------------------------- */

function BookingsTab() {
  const [items, setItems] = useState<BookingRecord[] | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/bookings")
      .then((r) => r.json())
      .then((j) => setItems(j.ok ? j.data : []));
  }, []);

  useEffect(load, [load]);

  async function setStatus(id: string, status: BookingRecord["status"]) {
    await fetch("/api/admin/bookings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  if (!items) return <p className="text-muted">Загружаем…</p>;
  if (items.length === 0) return <p className="text-muted">Записей пока нет.</p>;

  return (
    <div className="space-y-2">
      {items.map((b) => (
        <div key={b.id} className="rounded-control border border-line p-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px]">
              {formatDateLong(b.date)}, {b.time}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-pill px-2 py-0.5 text-xs",
                b.status === "confirmed" && "bg-accent text-accent-ink",
                b.status === "cancelled" && "bg-surface text-muted line-through",
                b.status === "new" && "border border-line",
              )}
            >
              {b.status === "new" ? "новая" : b.status === "confirmed" ? "подтверждена" : "отменена"}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted">
            {b.name} · <a href={`tel:${b.phone}`} className="text-ink underline underline-offset-2">{b.phone}</a> · {b.masterName}
          </p>

          <ul className="mt-2 space-y-0.5 text-sm text-muted">
            {b.lines.map((l) => (
              <li key={`${l.serviceId}-${l.variantId}`}>
                {l.serviceTitle} — {l.variantLabel}, {formatDuration(l.durationMin)}
              </li>
            ))}
          </ul>

          <p className="mt-2 text-sm">
            {formatDuration(b.totalDurationMin)} · {formatPrice(b.totalPrice, b.currency)}
          </p>

          {b.comment && <p className="mt-2 text-sm text-muted">«{b.comment}»</p>}

          {b.status !== "cancelled" && (
            <div className="mt-3 flex gap-2">
              {b.status === "new" && (
                <button
                  onClick={() => setStatus(b.id, "confirmed")}
                  className="min-h-11 flex-1 rounded-control bg-accent text-sm text-accent-ink"
                >
                  Подтвердить
                </button>
              )}
              <button
                onClick={() => setStatus(b.id, "cancelled")}
                className="min-h-11 flex-1 rounded-control border border-line text-sm"
              >
                Отменить
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------ Мелочи ---------------------------------- */

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-card border border-line bg-elevated p-4">
      <h2 className="text-[17px]">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-sm text-muted">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="time"
      value={value}
      step={900}
      onChange={(e) => onChange(e.target.value)}
      className="min-h-11 rounded-control border border-line bg-bg px-2 text-[15px] tabular-nums"
    />
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center px-4 text-muted">
      {children}
    </div>
  );
}
