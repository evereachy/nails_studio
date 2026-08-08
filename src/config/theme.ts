/**
 * ВНЕШНИЙ ВИД САЙТА — ОДНО СЛОВО.
 *
 *   couture — светлый редакционный: тонкие засечки, воздух, волосяные линии
 *   noir    — тёмный глянец: крупный гротеск, свечение, высокий контраст
 *   bloom   — мягкий розовый: округлые формы, живые тени, пружинистая анимация
 *
 * Меняется только эта строка. Компоненты о теме не знают:
 * весь визуал приходит из CSS-переменных в globals.css.
 */
export const THEME: ThemeName = "cupertino";

export type ThemeName = "cupertino" | "couture" | "noir" | "bloom";

export const themeNames: ThemeName[] = ["cupertino", "couture", "noir", "bloom"];

/**
 * Показ клиенту без пересборки: ?theme=bloom в адресе.
 * Работает только когда включено — на продакшене можно оставить,
 * поисковикам это не мешает, стиль по умолчанию берётся из THEME.
 */
export const ALLOW_THEME_QUERY = true;
