import { getMockBusy } from "@/mock/schedule";
import { toMinutes, toTime } from "@/features/availability/slots";
import { bookingRepository } from "@/features/booking/booking-repository";
import { settingsRepository } from "@/features/settings/settings-repository";
import type { Master, SalonSettings, ScheduleContext, TimeSlot } from "@/types";

type Interval = [TimeSlot, number];

/**
 * Removes individual master off-days from weekly schedule.
 * For "any master", a day is closed only when all active masters are off.
 */
function scheduleFor(settings: SalonSettings, masters: Master[], master: Master | null): SalonSettings {
  const offDays = master
    ? new Set(master.weekdaysOff)
    : new Set(
      masters.length
        ? [0, 1, 2, 3, 4, 5, 6].filter((wd) => masters.every((m) => m.weekdaysOff.includes(wd)))
        : [],
    );

  return {
    ...settings,
    workingHours: settings.workingHours.map((d) =>
      offDays.has(d.weekday) ? { ...d, open: null, close: null } : d,
    ),
  };
}

/** Merges interval slots into a 24-hour minute bitmask */
function toMask(intervals: Interval[]): Uint8Array {
  const mask = new Uint8Array(24 * 60);
  for (const [start, dur] of intervals) {
    const from = toMinutes(start);
    for (let i = from; i < Math.min(from + dur, mask.length); i++) mask[i] = 1;
  }
  return mask;
}

/** Reconstructs intervals from a minute bitmask */
function fromMask(mask: Uint8Array): Interval[] {
  const out: Interval[] = [];
  let start = -1;
  for (let i = 0; i <= mask.length; i++) {
    if (mask[i] === 1 && start === -1) start = i;
    if (mask[i] !== 1 && start !== -1) {
      out.push([toTime(start), i - start]);
      start = -1;
    }
  }
  return out;
}

/**
 * Calculates busy interval masks for a target date and master.
 */
function busyForDate(
  dateISO: string,
  byMaster: Map<string, Interval[]>,
  masters: Master[],
  master: Master | null,
): Interval[] {
  if (master) return byMaster.get(master.id) ?? [];
  if (masters.length === 0) return [];

  const masks = masters.map((m) => toMask(byMaster.get(m.id) ?? []));
  const result = new Uint8Array(24 * 60);
  for (let i = 0; i < result.length; i++) {
    result[i] = masks.every((mask) => mask[i] === 1) ? 1 : 0;
  }
  return fromMask(result);
}

/**
 * Prepares schedule and availability context for slot building.
 */
export async function getAvailability(masterId: string | null): Promise<
  ScheduleContext & { masters: Master[]; masterId: string | null }
> {
  const { settings, masters } = await settingsRepository.read();
  const active = masters.filter((m) => m.active);
  const master = masterId ? (active.find((m) => m.id === masterId) ?? null) : null;

  const bookings = await bookingRepository.listAll();

  const busy: Record<string, Interval[]> = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < settings.horizonDays; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const iso = `${year}-${month}-${day}`;

    const byMaster = new Map<string, Interval[]>();
    const mock = getMockBusy(iso);
    for (const m of active) byMaster.set(m.id, [...mock]);

    for (const b of bookings) {
      if (b.date !== iso || b.status === "cancelled") continue;
      const targets = b.masterId ? [b.masterId] : active.map((m) => m.id);
      for (const id of targets) {
        byMaster.set(id, [...(byMaster.get(id) ?? []), [b.time, b.totalDurationMin]]);
      }
    }

    const resolved = busyForDate(iso, byMaster, active, master);
    if (resolved.length) busy[iso] = resolved;
  }

  return {
    settings: scheduleFor(settings, active, master),
    busy,
    masters: active,
    masterId: master?.id ?? null,
  };
}
