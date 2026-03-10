export function isAdminEmail(email) {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || process.env.NEXT_PUBLIC_ADMIN_EMAILS || '';
  const allowed = raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return false;
  return allowed.includes(String(email).trim().toLowerCase());
}

