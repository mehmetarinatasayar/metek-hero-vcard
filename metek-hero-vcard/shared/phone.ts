/** Format complete Turkish numbers without guessing a country or changing digits. */
export function formatPhone(value: string): string {
  const raw = value.trim();
  if (!/^[+\d\s().-]*$/.test(raw)) return raw;
  const digits = raw.replace(/\D/g, "");
  const grouped = (n: string) => `${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 8)} ${n.slice(8)}`;
  if (raw.startsWith("+90") && digits.length === 12) return `+90 ${grouped(digits.slice(2))}`;
  if (!raw.includes("+") && digits.length === 11 && digits.startsWith("0")) return `0${grouped(digits.slice(1))}`;
  if (!raw.includes("+") && digits.length === 10 && /^[2-5]/.test(digits)) return grouped(digits);
  return raw;
}
