import type { ApiResult, BookingDraft, BookingRecord } from "@/types";

/**
 * Single boundary for booking HTTP transport.
 * Switching transport layer or backend endpoints only requires changes in this file.
 */
export async function postBooking(draft: BookingDraft): Promise<ApiResult<BookingRecord>> {
  try {
    const res = await fetch("/beauty/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data) {
      return {
        ok: false,
        error: data?.error ?? "Ошибка сервера. Попробуйте позже.",
      };
    }

    return data as ApiResult<BookingRecord>;
  } catch {
    return {
      ok: false,
      error: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.",
    };
  }
}
