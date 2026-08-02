import type { ApiResult, BookingDraft, BookingRecord } from "@/types";

/**
 * Единственное место, где фронт знает про транспорт.
 * Переезд на Supabase/Firebase/tRPC = правка только этого файла.
 */
export async function postBooking(draft: BookingDraft): Promise<ApiResult<BookingRecord>> {
  try {
    const res = await fetch("/api/book", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    return (await res.json()) as ApiResult<BookingRecord>;
  } catch {
    return { ok: false, error: "Нет связи с сервером. Проверьте интернет и попробуйте ещё раз." };
  }
}
