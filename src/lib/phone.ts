export function normalizePhone(phone: string): string {
  const trimmed = phone.trim();
  const digitsOnly = trimmed.replace(/[^\d]/g, "");
  if (trimmed.startsWith("+")) return `+${digitsOnly}`;
  return digitsOnly;
}

export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
