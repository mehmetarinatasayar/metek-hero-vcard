/** Accept a web address with or without a scheme; return a safe, absolute link. */
export function normalizeWebsite(value: string): string {
  const raw = value.trim();
  if (!raw) return "";
  if (/\s|\\/.test(raw)) throw new Error("Geçerli bir web adresi giriniz.");
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(raw);
  const url = new URL(hasScheme ? raw : `https://${raw}`);
  if (!["http:", "https:"].includes(url.protocol) || !url.hostname.includes(".") ||
      url.username || url.password || !/^[a-z\d\u0080-\uffff]/i.test(raw))
    throw new Error("Geçerli bir web adresi giriniz.");
  return url.href;
}
