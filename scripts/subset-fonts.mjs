// Скачивает с Google Fonts шрифты, урезанные до нужных букв, в папку fonts/.
// Запускать после правки текста в index.html:  node scripts/subset-fonts.mjs
//
// Cormorant (основной текст) — вся латиница и кириллица, чтобы текст можно было менять свободно.
// Caveat (рукописный) тяжёлый, поэтому в него попадают только буквы из заголовка,
// листка в конверте и подписи — их скрипт берёт прямо из index.html.
import fs from "node:fs";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const strip = (s) => s.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&");
const pick = (re) => [...html.matchAll(re)].map((m) => strip(m[1])).join(" ");

let body = "";
for (let c = 32; c < 127; c++) body += String.fromCharCode(c);
body += "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдеёжзийклмнопрстуфхцчшщъыьэюя«»—–…’‘“”№";

const script = pick(/<h1[^>]*>([\s\S]*?)<\/h1>/g)
  + pick(/class="env-paper">([\s\S]*?)<\/div>/g)
  + pick(/class="sign[^"]*"[^>]*>([\s\S]*?)<\/p>/g);
const caveatText = [...new Set(script.replace(/\s+/g, "") + " ")].join("");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const jobs = [
  ["Cormorant+Garamond:wght@500", body, "cormorant-500"],
  ["Cormorant+Garamond:wght@600", body, "cormorant-600"],
  ["Caveat:wght@700", caveatText, "caveat-700"],
];

fs.mkdirSync(new URL("../fonts/", import.meta.url), { recursive: true });
for (const [family, text, name] of jobs) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`, { headers: { "User-Agent": UA } })).text();
  const url = css.match(/url\((https:[^)]+)\)/)?.[1];
  if (!url) throw new Error(`${name}: Google Fonts не вернул шрифт\n${css}`);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  fs.writeFileSync(new URL(`../fonts/${name}.woff2`, import.meta.url), buf);
  console.log(`${name}.woff2  ${(buf.length / 1024).toFixed(1)} КБ`);
}
console.log("Caveat:", caveatText);
