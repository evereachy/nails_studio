/**
 * Проверка подключения к MongoDB и первичная инициализация.
 *
 *   node --env-file=.env.local scripts/db-check.mjs
 *
 * Что делает:
 *  1. подключается и пингует кластер;
 *  2. создаёт индексы для коллекции записей;
 *  3. если документа настроек ещё нет — кладёт значения по умолчанию,
 *     чтобы админка открылась не пустой.
 */
import { MongoClient } from "mongodb";

const URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB ?? "nails_studio";

if (!URI) {
  console.error("✗ MONGODB_URI не задан. Создайте .env.local и добавьте строку подключения.");
  process.exit(1);
}

if (URI.includes("<db_password>")) {
  console.error("✗ В строке подключения остался плейсхолдер <db_password>.");
  process.exit(1);
}

const defaultSettings = {
  workingHours: [
    { weekday: 1, open: "09:00", close: "20:00" },
    { weekday: 2, open: "09:00", close: "20:00" },
    { weekday: 3, open: "09:00", close: "20:00" },
    { weekday: 4, open: "09:00", close: "20:00" },
    { weekday: 5, open: "09:00", close: "20:00" },
    { weekday: 6, open: "10:00", close: "18:00" },
    { weekday: 0, open: "10:00", close: "18:00" },
  ],
  closedDates: [],
  slotStepMin: 30,
  horizonDays: 60,
};

const defaultMasters = [
  { id: "anna", name: "Анна", role: "Колорист, стрижки", active: true, serviceIds: ["haircut", "coloring", "styling"], weekdaysOff: [0] },
  { id: "lena", name: "Лена", role: "Мастер ногтевого сервиса", active: true, serviceIds: ["manicure"], weekdaysOff: [1] },
  { id: "vera", name: "Вера", role: "Брови и ресницы", active: true, serviceIds: [], weekdaysOff: [2] },
];

const client = new MongoClient(URI, { serverSelectionTimeoutMS: 8000 });

try {
  await client.connect();
  await client.db(DB_NAME).command({ ping: 1 });
  console.log(`✓ Подключение к кластеру есть, база «${DB_NAME}»`);

  const db = client.db(DB_NAME);

  await db.collection("bookings").createIndexes([
    { key: { date: 1, masterId: 1 }, name: "date_master" },
    { key: { id: 1 }, name: "public_id", unique: true },
    { key: { createdAt: -1 }, name: "recent" },
  ]);
  console.log("✓ Индексы коллекции bookings на месте");

  const existing = await db.collection("settings").findOne({ _id: "salon" });

  if (existing) {
    console.log(`✓ Настройки уже есть, обновлены ${existing.updatedAt ?? "неизвестно когда"}`);
  } else {
    await db.collection("settings").insertOne({
      _id: "salon",
      settings: defaultSettings,
      masters: defaultMasters,
      updatedAt: new Date().toISOString(),
    });
    console.log("✓ Записаны настройки по умолчанию и три мастера");
  }

  const count = await db.collection("bookings").countDocuments();
  console.log(`  Записей в базе: ${count}`);
  console.log("\nГотово. Запускайте npm run dev и открывайте /admin");
} catch (e) {
  const msg = e.message ?? String(e);
  console.error("✗ Не удалось подключиться:", msg);

  // У этих трёх проблем разные симптомы, и смешивать их в один список вредно:
  // человек начинает чинить не то, что сломано.
  if (/bad auth|AuthenticationFailed|auth failed/i.test(msg)) {
    console.error(
      "\nКластер ответил, но отклонил логин. Дело НЕ в IP.\n" +
        "  • проверьте, что используете Database User, а не аккаунт Atlas;\n" +
        "  • пересоздайте пароль: Database Access → Edit → Edit Password;\n" +
        "  • спецсимволы в пароле должны быть закодированы (@ → %40, : → %3A);\n" +
        "  • в строке не осталось угловых скобок <>.",
    );
  } else if (/ServerSelection|ETIMEDOUT|ECONNREFUSED|timed out/i.test(msg)) {
    console.error(
      "\nДо кластера не достучались. Вот это уже про сеть:\n" +
        "  • добавьте свой IP в Network Access;\n" +
        "  • для Vercel нужен 0.0.0.0/0 — адреса функций не фиксированы;\n" +
        "  • проверьте, что кластер не на паузе (бесплатный засыпает).",
    );
  } else if (/ENOTFOUND|querySrv|getaddrinfo/i.test(msg)) {
    console.error("\nХост из строки не резолвится — проверьте адрес кластера после @.");
  } else if (/not authorized/i.test(msg)) {
    console.error(`\nЛогин прошёл, но нет прав на базу «${DB_NAME}». Дайте роль readWrite.`);
  }

  process.exit(1);
} finally {
  await client.close();
}