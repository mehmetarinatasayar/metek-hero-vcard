import type { CardInput } from "./schema";

const escapeText = (v: string) =>
  v
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
// Fold at 75 UTF-8 octets without splitting a Turkish character.
export function foldLine(line: string): string {
  let result = "",
    current = "",
    bytes = 0;
  for (const char of line) {
    const n = new TextEncoder().encode(char).length;
    if (bytes + n > 75) {
      result += current + "\r\n";
      current = " ";
      bytes = 1;
    }
    current += char;
    bytes += n;
  }
  return result + current;
}
export function createVcf(card: CardInput): string {
  const e = escapeText;
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${e(card.lastName)};${e(card.firstName)};;;`,
    `FN:${e(card.firstName + " " + card.lastName)}`,
  ];
  if (card.company || card.department)
    lines.push(`ORG:${e(card.company)};${e(card.department)}`);
  if (card.title) lines.push(`TITLE:${e(card.title)}`);
  if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${e(card.phone)}`);
  if (card.mobilePhone)
    lines.push(`TEL;TYPE=CELL,VOICE:${e(card.mobilePhone)}`);
  if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${e(card.email)}`);
  if (card.address) lines.push(`ADR;TYPE=WORK:;;${e(card.address)};;;;`);
  if (card.website) lines.push(`URL:${e(card.website)}`);
  if (card.birthDate) lines.push(`BDAY:${card.birthDate}`);
  return [...lines, "END:VCARD"].map(foldLine).join("\r\n") + "\r\n";
}
